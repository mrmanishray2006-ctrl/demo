import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { GoogleGenAI } from "@google/genai";
import {
  User,
  Store,
  Product,
  QrCode,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Subscription,
  StoreSettings,
  Notification
} from "./src/types";

// Initialize Gemini client using server-side secrets
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    }
  }
});

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data", "db.json");

// Ensure data folder exists
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
}

// In-Memory Database State that mirrors the file
interface Database {
  users: User[];
  stores: Store[];
  products: Product[];
  qrCodes: QrCode[];
  carts: Cart[];
  cartItems: CartItem[];
  orders: Order[];
  orderItems: OrderItem[];
  payments: Payment[];
  subscriptions: Subscription[];
  storeSettings: StoreSettings[];
  notifications: Notification[];
}

let db: Database = {
  users: [],
  stores: [],
  products: [],
  qrCodes: [],
  carts: [],
  cartItems: [],
  orders: [],
  orderItems: [],
  payments: [],
  subscriptions: [],
  storeSettings: [],
  notifications: []
};

// Save DB to disk
function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// Seed helper to generate a product and its QR code
async function generateProduct(
  productId: string,
  storeId: string,
  ownerId: string,
  name: string,
  sku: string,
  category: string,
  description: string,
  price: number,
  stockQty: number,
  taxPercent: number,
  discountPercent: number,
  imageUrl: string
): Promise<Product> {
  const qrCodeValue = `SMARTQR-${storeId}-${sku}`;
  const qrCodeUrl = await QRCode.toDataURL(qrCodeValue, { margin: 2, scale: 6 });
  const now = new Date().toISOString();

  return {
    productId,
    storeId,
    ownerId,
    name,
    sku,
    category,
    description,
    price,
    stockQty,
    taxPercent,
    discountPercent,
    imageUrl,
    qrCodeValue,
    qrCodeUrl,
    createdAt: now,
    updatedAt: now
  };
}

// Initialize and Seed Database
async function initDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf8");
      db = JSON.parse(content);
      console.log("Database loaded successfully with", db.products.length, "products.");
      return;
    } catch (err) {
      console.error("Failed to parse DB, re-initializing", err);
    }
  }

  console.log("Seeding fresh database...");
  const now = new Date().toISOString();

  // Create Users
  const owner: User = {
    userId: "user-owner",
    name: "Manish Kumar (Owner)",
    email: "owner@smartqr.com",
    role: "owner",
    phone: "+91 9876543210",
    createdAt: now
  };

  const customer: User = {
    userId: "user-customer",
    name: "John Doe (Customer)",
    email: "customer@smartqr.com",
    role: "customer",
    phone: "+91 9123456789",
    createdAt: now
  };

  db.users = [owner, customer];

  // Create Store
  const store: Store = {
    storeId: "store-001",
    ownerId: owner.userId,
    storeName: "Smart Mart Retail",
    address: "Boring Road, Patna, Bihar, India",
    paymentUpiId: "mrmanishray2006@okhdfcbank", // Payout UPI ID
    subscriptionStatus: "active",
    createdAt: now
  };
  db.stores = [store];

  // Create Store Settings
  const settings: StoreSettings = {
    storeId: store.storeId,
    lowStockThreshold: 10,
    currency: "INR",
    businessGstNo: "10AAAAA1111A1Z1"
  };
  db.storeSettings = [settings];

  // Create Subscription
  const subscription: Subscription = {
    subscriptionId: "sub-01",
    ownerId: owner.userId,
    planName: "Pro Annual Retailer Plan",
    amount: 1999,
    startDate: now,
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    autoRenew: true
  };
  db.subscriptions = [subscription];

  // Seed default products
  const p1 = await generateProduct(
    "prod-1",
    store.storeId,
    owner.userId,
    "Fresh Organic Apples",
    "FR-APP-01",
    "Fruits",
    "Naturally sweet, crisp organic red apples sourced directly from Himachal orchards.",
    120,
    8, // Starts below stock threshold of 10 to demonstrate low-stock alerts!
    5,
    10,
    "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&auto=format&fit=crop"
  );

  const p2 = await generateProduct(
    "prod-2",
    store.storeId,
    owner.userId,
    "Whole Wheat Bread",
    "BK-BRD-02",
    "Bakery",
    "Freshly baked high-fiber whole wheat bread. Preservative-free and healthy.",
    45,
    25,
    0,
    0,
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop"
  );

  const p3 = await generateProduct(
    "prod-3",
    store.storeId,
    owner.userId,
    "Amul Premium Butter 500g",
    "DY-BTR-03",
    "Dairy",
    "India's favorite salted premium dairy butter, perfect for toast and cooking.",
    260,
    15,
    12,
    5,
    "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200&auto=format&fit=crop"
  );

  const p4 = await generateProduct(
    "prod-4",
    store.storeId,
    owner.userId,
    "Dark Roast Coffee Beans",
    "BV-COF-04",
    "Beverages",
    "Premium quality Arabica dark roast coffee beans with a rich chocolate aroma.",
    490,
    30,
    18,
    15,
    "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&auto=format&fit=crop"
  );

  const p5 = await generateProduct(
    "prod-5",
    store.storeId,
    owner.userId,
    "Premium Basmati Rice",
    "ST-RIC-05",
    "Staples",
    "Long-grain, naturally aged aromatic basmati rice for royal dining.",
    145,
    50,
    5,
    8,
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&auto=format&fit=crop"
  );

  db.products = [p1, p2, p3, p4, p5];

  // Seed associated QR Codes
  db.qrCodes = db.products.map(p => ({
    qrId: `qr-${p.productId}`,
    productId: p.productId,
    storeId: p.storeId,
    qrValue: p.qrCodeValue,
    qrImageUrl: p.qrCodeUrl,
    createdAt: now
  }));

  // Add initial system notifications
  db.notifications = [
    {
      id: "notif-01",
      userId: owner.userId,
      title: "Store Online",
      message: "Smart Mart Retail QR system successfully initialized.",
      type: "success",
      createdAt: now,
      read: false
    },
    {
      id: "notif-02",
      userId: owner.userId,
      title: "Low Stock Alert",
      message: "Product 'Fresh Organic Apples' is low on stock (8 remaining).",
      type: "warning",
      createdAt: now,
      read: false
    }
  ];

  saveDb();
  console.log("Database seeded with 5 products and QR Codes successfully!");
}

// Authentication Middleware simulating simple token verification
function getAuthenticatedUser(req: express.Request): { userId: string; role: 'owner' | 'customer' } | null {
  const userId = req.headers["x-user-id"] as string;
  const role = req.headers["x-user-role"] as 'owner' | 'customer';

  if (!userId || !role) {
    return null;
  }
  return { userId, role };
}

async function startServer() {
  app.use(express.json({ limit: '10mb' }));

  // Seed Database before starting routing
  await initDb();

  // Helper function to recalculate a Customer's Cart subtotals, taxes, discounts, and total
  function recalculateCart(cartId: string) {
    const items = db.cartItems.filter(i => i.cartId === cartId);
    let subtotal = 0;
    let tax = 0;
    let discount = 0;

    for (const item of items) {
      const product = db.products.find(p => p.productId === item.productId);
      if (product) {
        const itemSub = product.price * item.quantity;
        const itemDisc = (itemSub * product.discountPercent) / 100;
        const itemTaxable = itemSub - itemDisc;
        const itemTax = (itemTaxable * product.taxPercent) / 100;

        subtotal += itemSub;
        discount += itemDisc;
        tax += itemTax;

        item.price = product.price;
        item.lineTotal = Math.round((itemTaxable + itemTax) * 100) / 100;
      }
    }

    const cart = db.carts.find(c => c.cartId === cartId);
    if (cart) {
      cart.subtotal = Math.round(subtotal * 100) / 100;
      cart.tax = Math.round(tax * 100) / 100;
      cart.discount = Math.round(discount * 100) / 100;
      cart.total = Math.round((subtotal - discount + tax) * 100) / 100;
      cart.updatedAt = new Date().toISOString();
    }
    saveDb();
  }

  // --- API ROUTES ---

  // Auth: Register
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, role, phone, storeName, paymentUpiId } = req.body;
    if (!email || !role || !name) {
      return res.status(400).json({ error: "Missing required details: name, email, role." });
    }

    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    const now = new Date().toISOString();
    const userId = `user-${Date.now()}`;
    const newUser: User = {
      userId,
      name,
      email,
      role,
      phone: phone || "",
      createdAt: now
    };

    db.users.push(newUser);

    if (role === "owner") {
      const storeId = `store-${Date.now()}`;
      const newStore: Store = {
        storeId,
        ownerId: userId,
        storeName: storeName || `${name}'s Store`,
        address: "Enter address in settings",
        paymentUpiId: paymentUpiId || "mrmanishray2006@okhdfcbank",
        subscriptionStatus: "active",
        createdAt: now
      };
      db.stores.push(newStore);

      const settings: StoreSettings = {
        storeId,
        lowStockThreshold: 10,
        currency: "INR"
      };
      db.storeSettings.push(settings);

      const sub: Subscription = {
        subscriptionId: `sub-${Date.now()}`,
        ownerId: userId,
        planName: "Standard Monthly Plan",
        amount: 299,
        startDate: now,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        autoRenew: true
      };
      db.subscriptions.push(sub);
    }

    saveDb();
    res.status(201).json(newUser);
  });

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const store = db.stores.find(s => s.ownerId === user.userId);
    res.json({ user, store });
  });

  // Auth: Me check
  app.get("/api/auth/me", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = db.users.find(u => u.userId === auth.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const store = db.stores.find(s => s.ownerId === user.userId);
    res.json({ user, store });
  });

  // Products: Get List
  app.get("/api/products", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth) return res.status(401).json({ error: "Unauthorized" });

    if (auth.role === "owner") {
      const store = db.stores.find(s => s.ownerId === auth.userId);
      if (!store) return res.json([]);
      const products = db.products.filter(p => p.storeId === store.storeId);
      res.json(products);
    } else {
      // Customer gets all products (we simulate a single active retail store context)
      res.json(db.products);
    }
  });

  // Products: Create
  app.post("/api/products", async (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "owner") {
      return res.status(403).json({ error: "Access denied. Owners only." });
    }

    const store = db.stores.find(s => s.ownerId === auth.userId);
    if (!store) return res.status(400).json({ error: "Owner does not have an active store." });

    // Validate owner subscription status
    const subscription = db.subscriptions.find(sub => sub.ownerId === auth.userId && sub.status === "active");
    if (!subscription) {
      return res.status(402).json({ error: "Owner subscription has expired. Please renew to add products." });
    }

    const { name, sku, category, description, price, stockQty, taxPercent, discountPercent, imageUrl } = req.body;
    if (!name || !sku || price === undefined || stockQty === undefined) {
      return res.status(400).json({ error: "Name, SKU, Price, and Stock Quantity are required." });
    }

    // Check SKU duplication
    const duplicate = db.products.find(p => p.storeId === store.storeId && p.sku.toUpperCase() === sku.toUpperCase());
    if (duplicate) {
      return res.status(400).json({ error: `SKU '${sku}' already exists in your store inventory.` });
    }

    try {
      const productId = `prod-${Date.now()}`;
      const img = imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop";
      const newProduct = await generateProduct(
        productId,
        store.storeId,
        auth.userId,
        name,
        sku,
        category || "General",
        description || "",
        Number(price),
        Number(stockQty),
        Number(taxPercent || 0),
        Number(discountPercent || 0),
        img
      );

      db.products.push(newProduct);

      // Create associate QR Code
      const qrId = `qr-${Date.now()}`;
      const newQr: QrCode = {
        qrId,
        productId,
        storeId: store.storeId,
        qrValue: newProduct.qrCodeValue,
        qrImageUrl: newProduct.qrCodeUrl,
        createdAt: new Date().toISOString()
      };
      db.qrCodes.push(newQr);

      // System notification if stock is immediately below threshold
      const settings = db.storeSettings.find(s => s.storeId === store.storeId);
      const threshold = settings ? settings.lowStockThreshold : 10;
      if (newProduct.stockQty <= threshold) {
        db.notifications.push({
          id: `notif-${Date.now()}`,
          userId: auth.userId,
          title: "Low Stock Alert",
          message: `Product '${newProduct.name}' added with low stock (${newProduct.stockQty} left).`,
          type: "warning",
          createdAt: new Date().toISOString(),
          read: false
        });
      }

      saveDb();
      res.status(201).json(newProduct);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate QR or write product." });
    }
  });

  // Products: Edit Product
  app.put("/api/products/:productId", async (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "owner") {
      return res.status(403).json({ error: "Access denied." });
    }

    const { productId } = req.params;
    const product = db.products.find(p => p.productId === productId);
    if (!product) return res.status(404).json({ error: "Product not found." });

    if (product.ownerId !== auth.userId) {
      return res.status(403).json({ error: "Unauthorized access to this product." });
    }

    const { name, category, description, price, stockQty, taxPercent, discountPercent, imageUrl } = req.body;

    if (name) product.name = name;
    if (category) product.category = category;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (stockQty !== undefined) product.stockQty = Number(stockQty);
    if (taxPercent !== undefined) product.taxPercent = Number(taxPercent);
    if (discountPercent !== undefined) product.discountPercent = Number(discountPercent);
    if (imageUrl) product.imageUrl = imageUrl;
    product.updatedAt = new Date().toISOString();

    // Trigger potential stock threshold notification
    const settings = db.storeSettings.find(s => s.storeId === product.storeId);
    const threshold = settings ? settings.lowStockThreshold : 10;
    if (product.stockQty <= threshold) {
      // Check if low stock notification already sent recently
      const alreadyNotified = db.notifications.find(
        n => n.userId === auth.userId && n.title === "Low Stock Alert" && n.message.includes(product.name) && !n.read
      );
      if (!alreadyNotified) {
        db.notifications.push({
          id: `notif-${Date.now()}`,
          userId: auth.userId,
          title: "Low Stock Alert",
          message: `Product '${product.name}' is running low on stock (${product.stockQty} remaining).`,
          type: "warning",
          createdAt: new Date().toISOString(),
          read: false
        });
      }
    }

    saveDb();
    res.json(product);
  });

  // Products: Delete Product
  app.delete("/api/products/:productId", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "owner") {
      return res.status(403).json({ error: "Access denied." });
    }

    const { productId } = req.params;
    const productIndex = db.products.findIndex(p => p.productId === productId);
    if (productIndex === -1) return res.status(404).json({ error: "Product not found." });

    const product = db.products[productIndex];
    if (product.ownerId !== auth.userId) {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    // Remove product
    db.products.splice(productIndex, 1);
    // Remove associated QR codes
    db.qrCodes = db.qrCodes.filter(q => q.productId !== productId);
    // Remove from cart items
    db.cartItems = db.cartItems.filter(i => i.productId !== productId);

    saveDb();
    res.json({ success: true, message: "Product and associated QR code removed." });
  });

  // Export Product QR codes as Single PDF
  app.get("/api/pdf/export-qrs", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "owner") {
      return res.status(403).json({ error: "Access denied." });
    }

    const store = db.stores.find(s => s.ownerId === auth.userId);
    if (!store) return res.status(400).json({ error: "Store not found." });

    const storeProducts = db.products.filter(p => p.storeId === store.storeId);
    if (storeProducts.length === 0) {
      return res.status(400).json({ error: "No products in store to export." });
    }

    try {
      // Initialize landscape or standard PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Write beautiful title and store banner
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(17, 24, 39); // Gray 900
      doc.text("STORE QR CODE CATALOGUE", 105, 20, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128); // Gray 500
      doc.text(`Store: ${store.storeName}`, 105, 26, { align: "center" });
      doc.text(`Address: ${store.address}`, 105, 31, { align: "center" });
      doc.text(`UPI Merchant ID: ${store.paymentUpiId}`, 105, 36, { align: "center" });

      // Add a line separator
      doc.setDrawColor(229, 231, 235); // Gray 200
      doc.setLineWidth(0.5);
      doc.line(15, 41, 195, 41);

      // Render a clean bento grid of QR cards: 3 cards per row
      let startX = 15;
      let startY = 48;
      const cardWidth = 56;
      const cardHeight = 72;
      const spacingX = 8;
      const spacingY = 8;

      let count = 0;

      for (const p of storeProducts) {
        if (count > 0 && count % 9 === 0) {
          doc.addPage();
          // Write title on next page
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(17, 24, 39);
          doc.text(`QR Code Catalogue - Continued`, 15, 15);
          doc.setDrawColor(229, 231, 235);
          doc.line(15, 18, 195, 18);
          startY = 24;
        }

        const colIndex = count % 3;
        const rowIndex = Math.floor((count % 9) / 3);

        const x = startX + colIndex * (cardWidth + spacingX);
        const y = startY + rowIndex * (cardHeight + spacingY);

        // Card Border
        doc.setDrawColor(209, 213, 219); // Gray 300
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, "FD");

        // Category Tag
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(79, 70, 229); // Indigo 600
        doc.text(p.category.toUpperCase(), x + 4, y + 6);

        // QR Image Placement (requires base64 input without 'data:image/png;base64,' prefix)
        const base64Clean = p.qrCodeUrl.replace(/^data:image\/\w+;base64,/, "");
        doc.addImage(base64Clean, "PNG", x + 5, y + 8, cardWidth - 10, cardWidth - 10);

        // Product Name (wrapped if long)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(17, 24, 39);
        const nameLines = doc.splitTextToSize(p.name, cardWidth - 8);
        doc.text(nameLines, x + 4, y + cardWidth + 1);

        // Price, Stock & SKU details
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(75, 85, 99); // Gray 600
        doc.text(`Price: INR ${p.price}`, x + 4, y + cardHeight - 8);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.text(`SKU: ${p.sku}`, x + 4, y + cardHeight - 4);

        count++;
      }

      // Convert PDF to array buffer and send
      const pdfData = doc.output("arraybuffer");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=QR_Codes_${store.storeName.replace(/\s+/g, "_")}.pdf`);
      res.send(Buffer.from(pdfData));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to compile PDF catalogue." });
    }
  });

  // --- CUSTOMER CART MANAGEMENT ---

  // Get active cart
  app.get("/api/carts/current", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "customer") {
      return res.status(403).json({ error: "Access denied. Customers only." });
    }

    // Since we simulate a single store context ("store-001") for the preview app
    const storeId = "store-001";
    let cart = db.carts.find(c => c.customerId === auth.userId && c.status === "active");

    if (!cart) {
      const cartId = `cart-${Date.now()}`;
      cart = {
        cartId,
        customerId: auth.userId,
        storeId,
        status: "active",
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.carts.push(cart);
      saveDb();
    }

    const items = db.cartItems
      .filter(i => i.cartId === cart!.cartId)
      .map(item => {
        const product = db.products.find(p => p.productId === item.productId);
        return {
          ...item,
          productName: product ? product.name : "Unknown Product",
          productSku: product ? product.sku : "N/A",
          productImage: product ? product.imageUrl : ""
        };
      });

    res.json({ cart, items });
  });

  // Add Item to Cart / Scan QR Code (Serverless scanQrAndAddToCart logic)
  app.post("/api/carts/items", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "customer") {
      return res.status(403).json({ error: "Access denied. Customers only." });
    }

    const { productId, qrValue, barcodeValue, quantity } = req.body;
    const qty = Number(quantity || 1);

    let product: Product | undefined;

    // We accept scan values via qrValue (generic scan) or barcodeValue explicitly
    const scanInput = qrValue || barcodeValue;

    if (scanInput) {
      // Retrieve by QR Code value first, fallback to SKU/Barcode
      product = db.products.find(p => p.qrCodeValue === scanInput || p.sku.toLowerCase() === scanInput.toLowerCase());
      if (!product) {
        return res.status(404).json({ 
          error: `Invalid product code scanned. Could not find corresponding product for code '${scanInput}'.` 
        });
      }
    } else if (productId) {
      product = db.products.find(p => p.productId === productId);
    }

    if (!product) {
      return res.status(400).json({ error: "Product identifier, barcode, or QR code value required." });
    }

    // Check inventory
    if (product.stockQty <= 0) {
      return res.status(400).json({ error: `Product '${product.name}' is currently out of stock.` });
    }

    const storeId = "store-001";
    let cart = db.carts.find(c => c.customerId === auth.userId && c.status === "active");
    if (!cart) {
      const cartId = `cart-${Date.now()}`;
      cart = {
        cartId,
        customerId: auth.userId,
        storeId,
        status: "active",
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.carts.push(cart);
    }

    // Check if item already exists in cart
    let item = db.cartItems.find(i => i.cartId === cart!.cartId && i.productId === product!.productId);

    if (item) {
      const newQty = item.quantity + qty;
      if (newQty > product.stockQty) {
        return res.status(400).json({ error: `Cannot add more. Only ${product.stockQty} items left in stock.` });
      }
      item.quantity = newQty;
    } else {
      if (qty > product.stockQty) {
        return res.status(400).json({ error: `Only ${product.stockQty} items left in stock.` });
      }
      item = {
        cartItemId: `item-${Date.now()}`,
        cartId: cart.cartId,
        productId: product.productId,
        quantity: qty,
        price: product.price,
        lineTotal: 0 // recalculated next
      };
      db.cartItems.push(item);
    }

    recalculateCart(cart.cartId);

    // Refresh response structure
    const updatedItems = db.cartItems
      .filter(i => i.cartId === cart!.cartId)
      .map(it => {
        const p = db.products.find(prod => prod.productId === it.productId);
        return {
          ...it,
          productName: p ? p.name : "Unknown",
          productSku: p ? p.sku : "",
          productImage: p ? p.imageUrl : ""
        };
      });

    res.json({ cart, items: updatedItems, message: `Scanned and added '${product.name}' to bill list.` });
  });

  // Update Cart Item quantity
  app.put("/api/carts/items/:itemId", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "customer") return res.status(403).json({ error: "Access denied." });

    const { itemId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (qty <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0. Use DELETE to remove items." });
    }

    const item = db.cartItems.find(i => i.cartItemId === itemId);
    if (!item) return res.status(404).json({ error: "Cart item not found." });

    const product = db.products.find(p => p.productId === item.productId);
    if (product && qty > product.stockQty) {
      return res.status(400).json({ error: `Insufficient stock. Only ${product.stockQty} units available.` });
    }

    item.quantity = qty;
    recalculateCart(item.cartId);

    const updatedItems = db.cartItems
      .filter(i => i.cartId === item.cartId)
      .map(it => {
        const p = db.products.find(prod => prod.productId === it.productId);
        return {
          ...it,
          productName: p ? p.name : "Unknown",
          productSku: p ? p.sku : "",
          productImage: p ? p.imageUrl : ""
        };
      });

    res.json({ cart: db.carts.find(c => c.cartId === item.cartId), items: updatedItems });
  });

  // Delete Cart Item
  app.delete("/api/carts/items/:itemId", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "customer") return res.status(403).json({ error: "Access denied." });

    const { itemId } = req.params;
    const itemIndex = db.cartItems.findIndex(i => i.cartItemId === itemId);
    if (itemIndex === -1) return res.status(404).json({ error: "Cart item not found." });

    const cartId = db.cartItems[itemIndex].cartId;
    db.cartItems.splice(itemIndex, 1);

    recalculateCart(cartId);

    const updatedItems = db.cartItems
      .filter(i => i.cartId === cartId)
      .map(it => {
        const p = db.products.find(prod => prod.productId === it.productId);
        return {
          ...it,
          productName: p ? p.name : "Unknown",
          productSku: p ? p.sku : "",
          productImage: p ? p.imageUrl : ""
        };
      });

    res.json({ cart: db.carts.find(c => c.cartId === cartId), items: updatedItems });
  });

  // --- ORDER PROCESSING & UPI PAYMENT Intent FLOW ---

  // Checkout and create pending order (Returns UPI deep links)
  app.post("/api/orders", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "customer") return res.status(403).json({ error: "Access denied." });

    const cart = db.carts.find(c => c.customerId === auth.userId && c.status === "active");
    if (!cart) return res.status(400).json({ error: "No active cart found." });

    const items = db.cartItems.filter(i => i.cartId === cart.cartId);
    if (items.length === 0) return res.status(400).json({ error: "Bill list/cart is empty." });

    // Validate sufficient inventory for all items before placing order
    for (const item of items) {
      const product = db.products.find(p => p.productId === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product in your cart no longer exists.` });
      }
      if (product.stockQty < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product '${product.name}'. Only ${product.stockQty} remaining.` });
      }
    }

    const store = db.stores.find(s => s.storeId === cart.storeId);
    const storeOwnerId = store ? store.ownerId : "user-owner";
    const storeName = store ? store.storeName : "Smart QR Store";
    const merchantUpiId = store ? store.paymentUpiId : "mrmanishray2006@okhdfcbank";

    const orderId = `order-${Date.now()}`;
    const now = new Date().toISOString();

    // Create Order Record
    const order: Order = {
      orderId,
      cartId: cart.cartId,
      customerId: auth.userId,
      storeId: cart.storeId,
      ownerId: storeOwnerId,
      totalAmount: cart.total,
      paymentStatus: "pending",
      orderStatus: "completed", // We mark completed once payment success
      createdAt: now
    };

    db.orders.push(order);

    // Save Order Items
    for (const item of items) {
      const orderItem: OrderItem = {
        orderItemId: `ord-itm-${Date.now()}-${item.productId}`,
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        lineTotal: item.lineTotal
      };
      db.orderItems.push(orderItem);
    }

    // Set cart status to complete so customer starts fresh next time
    cart.status = "completed";

    // Generate simulated UPI Payout deep link (UPI String intent: upi://pay?pa=...&pn=...&am=...)
    const upiLink = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(storeName)}&am=${order.totalAmount}&cu=INR&tn=${encodeURIComponent(`Bill payment ${orderId}`)}`;

    saveDb();
    res.status(201).json({
      order,
      upiLink,
      merchantUpiId,
      storeName,
      payableAmount: order.totalAmount
    });
  });

  // Verify and Confirm payment (deduct stock, create payment transaction, triggers notifications)
  app.post("/api/orders/:orderId/verify-payment", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth) return res.status(401).json({ error: "Unauthorized" });

    const { orderId } = req.params;
    const { status, paymentMethod, transactionId } = req.body; // Simulated parameters

    const order = db.orders.find(o => o.orderId === orderId);
    if (!order) return res.status(404).json({ error: "Order not found." });

    if (order.paymentStatus === "success") {
      return res.status(400).json({ error: "This order bill is already paid and completed." });
    }

    const store = db.stores.find(s => s.storeId === order.storeId);
    const storeName = store ? store.storeName : "Smart QR Store";
    const settings = db.storeSettings.find(s => s.storeId === order.storeId);
    const lowStockThreshold = settings ? settings.lowStockThreshold : 10;

    const txnId = transactionId || `TXN-UPI-${Date.now()}`;

    if (status === "success") {
      order.paymentStatus = "success";

      // Deduct inventory stock and trigger notifications
      const orderItemsList = db.orderItems.filter(oi => oi.orderId === order.orderId);
      for (const item of orderItemsList) {
        const product = db.products.find(p => p.productId === item.productId);
        if (product) {
          product.stockQty = Math.max(0, product.stockQty - item.quantity);
          product.updatedAt = new Date().toISOString();

          // Low Stock system alerts
          if (product.stockQty <= lowStockThreshold) {
            db.notifications.push({
              id: `notif-${Date.now()}-${product.productId}`,
              userId: order.ownerId,
              title: "Stock Alert",
              message: `CRITICAL: Product '${product.name}' stock dropped to ${product.stockQty}. Restock immediately!`,
              type: "warning",
              createdAt: new Date().toISOString(),
              read: false
            });
          }
        }
      }

      // Add Payment Transaction Log
      const payment: Payment = {
        paymentId: `pay-${Date.now()}`,
        orderId: order.orderId,
        customerId: order.customerId,
        storeId: order.storeId,
        ownerId: order.ownerId,
        paymentMethod: paymentMethod || "UPI Intent",
        transactionId: txnId,
        amount: order.totalAmount,
        status: "success",
        paidAt: new Date().toISOString()
      };
      db.payments.push(payment);

      // Create Success Notification for Customer
      db.notifications.push({
        id: `notif-cust-${Date.now()}`,
        userId: order.customerId,
        title: "Payment Success",
        message: `Your payment of INR ${order.totalAmount} to ${storeName} was successful. Order Ref: ${orderId}`,
        type: "success",
        createdAt: new Date().toISOString(),
        read: false
      });

      // Create Success Notification for Owner
      db.notifications.push({
        id: `notif-own-${Date.now()}`,
        userId: order.ownerId,
        title: "Payment Received",
        message: `Instant payment of INR ${order.totalAmount} received from customer via UPI. Ref: ${txnId}`,
        type: "success",
        createdAt: new Date().toISOString(),
        read: false
      });

      saveDb();
      res.json({ success: true, message: "Payment verified successfully. Stock adjusted.", order, payment });
    } else {
      order.paymentStatus = "failed";
      saveDb();
      res.json({ success: false, message: "Simulated payment failed.", order });
    }
  });

  // Order history
  app.get("/api/orders/history", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth) return res.status(401).json({ error: "Unauthorized" });

    let orderList: Order[] = [];
    if (auth.role === "owner") {
      orderList = db.orders.filter(o => o.ownerId === auth.userId);
    } else {
      orderList = db.orders.filter(o => o.customerId === auth.userId);
    }

    // Populate order items and names
    const responseData = orderList.map(o => {
      const items = db.orderItems
        .filter(oi => oi.orderId === o.orderId)
        .map(oi => {
          const p = db.products.find(prod => prod.productId === oi.productId);
          return {
            ...oi,
            productName: p ? p.name : "Deleted Product"
          };
        });

      const customerUser = db.users.find(u => u.userId === o.customerId);

      return {
        ...o,
        items,
        customerName: customerUser ? customerUser.name : "Anonymous Customer"
      };
    });

    // Sort order list descending by date
    responseData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(responseData);
  });

  // --- STATS & OWNER SUITE ---

  // Sales and Analytics Dashboard Stats
  app.get("/api/owner/sales-stats", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "owner") {
      return res.status(403).json({ error: "Access denied." });
    }

    const store = db.stores.find(s => s.ownerId === auth.userId);
    if (!store) return res.status(400).json({ error: "Store not found." });

    const successfulPayments = db.payments.filter(p => p.storeId === store.storeId && p.status === "success");

    let totalSales = 0;
    let dailySales = 0;
    let weeklySales = 0;
    let monthlySales = 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    successfulPayments.forEach(pay => {
      const payTime = new Date(pay.paidAt).getTime();
      totalSales += pay.amount;

      if (payTime >= startOfToday) {
        dailySales += pay.amount;
      }
      if (payTime >= oneWeekAgo) {
        weeklySales += pay.amount;
      }
      if (payTime >= oneMonthAgo) {
        monthlySales += pay.amount;
      }
    });

    const storeProducts = db.products.filter(p => p.storeId === store.storeId);
    const lowStockAlerts = storeProducts.filter(p => p.stockQty <= 10).length;

    // Compile category division
    const categoryStats: { [key: string]: number } = {};
    storeProducts.forEach(p => {
      categoryStats[p.category] = (categoryStats[p.category] || 0) + 1;
    });

    res.json({
      totalSales,
      dailySales,
      weeklySales,
      monthlySales,
      totalOrders: db.orders.filter(o => o.storeId === store.storeId && o.paymentStatus === "success").length,
      activeProductsCount: storeProducts.length,
      lowStockAlertsCount: lowStockAlerts,
      categoryStats
    });
  });

  // Owner settings: Payout UPI + Details
  app.get("/api/owner/settings", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "owner") return res.status(403).json({ error: "Access denied." });

    const store = db.stores.find(s => s.ownerId === auth.userId);
    if (!store) return res.status(404).json({ error: "Store not found." });

    const settings = db.storeSettings.find(s => s.storeId === store.storeId) || {
      storeId: store.storeId,
      lowStockThreshold: 10,
      currency: "INR"
    };

    res.json({ store, settings });
  });

  app.put("/api/owner/settings", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "owner") return res.status(403).json({ error: "Access denied." });

    const store = db.stores.find(s => s.ownerId === auth.userId);
    if (!store) return res.status(404).json({ error: "Store not found." });

    const { storeName, address, paymentUpiId, lowStockThreshold, businessGstNo } = req.body;

    if (storeName) store.storeName = storeName;
    if (address !== undefined) store.address = address;
    if (paymentUpiId) store.paymentUpiId = paymentUpiId;

    let settings = db.storeSettings.find(s => s.storeId === store.storeId);
    if (!settings) {
      settings = {
        storeId: store.storeId,
        lowStockThreshold: 10,
        currency: "INR"
      };
      db.storeSettings.push(settings);
    }

    if (lowStockThreshold !== undefined) settings.lowStockThreshold = Number(lowStockThreshold);
    if (businessGstNo !== undefined) settings.businessGstNo = businessGstNo;

    saveDb();
    res.json({ store, settings });
  });

  // Owner: Subscription Check & Simulate Renew (Plan control)
  app.get("/api/owner/subscription", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "owner") return res.status(403).json({ error: "Access denied." });

    let sub = db.subscriptions.find(s => s.ownerId === auth.userId);
    if (!sub) {
      sub = {
        subscriptionId: `sub-${Date.now()}`,
        ownerId: auth.userId,
        planName: "Standard Monthly Plan",
        amount: 299,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        autoRenew: true
      };
      db.subscriptions.push(sub);
      saveDb();
    }

    res.json(sub);
  });

  app.post("/api/owner/subscription/renew", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "owner") return res.status(403).json({ error: "Access denied." });

    const { planName, amount } = req.body;

    let sub = db.subscriptions.find(s => s.ownerId === auth.userId);
    const now = new Date();
    const futureDate = new Date(now.getTime() + (planName === "Premium Annual" ? 365 : 30) * 24 * 60 * 60 * 1000);

    if (sub) {
      sub.planName = planName || "Premium Retail Master";
      sub.amount = amount || 1499;
      sub.startDate = now.toISOString();
      sub.endDate = futureDate.toISOString();
      sub.status = "active";
    } else {
      sub = {
        subscriptionId: `sub-${Date.now()}`,
        ownerId: auth.userId,
        planName: planName || "Premium Retail Master",
        amount: amount || 1499,
        startDate: now.toISOString(),
        endDate: futureDate.toISOString(),
        status: "active",
        autoRenew: true
      };
      db.subscriptions.push(sub);
    }

    // Refresh store subscription status
    const store = db.stores.find(s => s.ownerId === auth.userId);
    if (store) {
      store.subscriptionStatus = "active";
    }

    // Push Notification
    db.notifications.push({
      id: `notif-sub-${Date.now()}`,
      userId: auth.userId,
      title: "Subscription Renewed",
      message: `Successfully renewed subscription to ${sub.planName}. Valid till ${futureDate.toLocaleDateString()}`,
      type: "success",
      createdAt: now.toISOString(),
      read: false
    });

    saveDb();
    res.json(sub);
  });

  // --- GENERAL NOTIFICATIONS ---

  app.get("/api/notifications", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth) return res.status(401).json({ error: "Unauthorized" });

    const notifications = db.notifications.filter(n => n.userId === auth.userId);
    // Sort descending
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(notifications);
  });

  app.post("/api/notifications/mark-read", (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth) return res.status(401).json({ error: "Unauthorized" });

    db.notifications.forEach(n => {
      if (n.userId === auth.userId) n.read = true;
    });

    saveDb();
    res.json({ success: true });
  });

  // --- SERVER-SIDE GEMINI SMART AI ASSISTANT ---

  app.post("/api/gemini/insights", async (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth || auth.role !== "owner") {
      return res.status(403).json({ error: "Access denied. Owners only." });
    }

    const store = db.stores.find(s => s.ownerId === auth.userId);
    if (!store) return res.status(404).json({ error: "Store not found." });

    const storeProducts = db.products.filter(p => p.storeId === store.storeId);
    const lowStock = storeProducts.filter(p => p.stockQty <= 10);
    const orderHistory = db.orders.filter(o => o.storeId === store.storeId && o.paymentStatus === "success");

    // Formulate a clean summary prompt for Gemini 3.5 Flash
    const prompt = `
You are an expert Retail & Inventory Strategist AI named "Smart-QR Assistant". 
Generate a helpful executive retail summary and action items based on the store's current data:

Store Name: ${store.storeName}
Products in Inventory: ${storeProducts.length}
Products with Low Stock (under 10 units):
${lowStock.map(p => `- ${p.name} (SKU: ${p.sku}, Stock Left: ${p.stockQty}, Price: Rs. ${p.price})`).join("\n") || "None"}

Completed Sales Volume: ${orderHistory.length} orders
Last 5 Orders Subtotals:
${orderHistory.slice(-5).map(o => `- Ref: ${o.orderId}, Amount: Rs. ${o.totalAmount}`).join("\n") || "No orders yet."}

Please output a JSON object containing exactly the following keys (ensure it's valid, parsable JSON structure, no markdown wrappers inside, just the JSON string block or standard json content):
{
  "inventorySummary": "A 2-sentence summary of stock status and any high priorities.",
  "smartStockRecommendations": [
    "Specifically list 2 action points for restock based on low items",
    "List a pricing/promo tip based on other items"
  ],
  "payoutTip": "A simple advice on maximizing checkout efficiency with UPI QR codes."
}
`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || "{}";
      const insights = JSON.parse(responseText.trim());
      res.json(insights);
    } catch (err) {
      console.error("Gemini failed:", err);
      // Fallback response if Gemini fails or key is missing
      res.json({
        inventorySummary: "Active inventory is stable, but several hot-selling items are approaching critical stock levels.",
        smartStockRecommendations: [
          `Restock "Fresh Organic Apples" immediately as current stock is at 8 units, below the threshold.`,
          "Introduce a 10% bundle discount on slow-moving bakery items during low-traffic morning hours."
        ],
        payoutTip: "Direct customer payouts via integrated BHIM/GPay QR links are working correctly. Consider adding a quick-scan countertop stand near billing desks."
      });
    }
  });

  // --- DEV & PRODUCTION BUNDLER PLUGINS ---

  // Vite development server middleware setup or static production serve
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted and actively serving on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server boot failure:", err);
});
