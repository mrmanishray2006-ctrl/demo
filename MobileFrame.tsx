import React, { useState, useEffect } from "react";
import {
  QrCode,
  ShoppingCart,
  Receipt,
  User,
  Plus,
  Minus,
  Trash2,
  Camera,
  Play,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Tag,
  CreditCard,
  DollarSign,
  Smartphone,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Home,
  Barcode
} from "lucide-react";
import { Product, Cart, CartItem, Order } from "../types";

interface CustomerDashboardProps {
  currentUser: any;
  onLogout: () => void;
  onRefreshGlobal: () => void;
  triggerRefreshStamp: number;
}

export default function CustomerDashboard({
  currentUser,
  onLogout,
  onRefreshGlobal,
  triggerRefreshStamp
}: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"scan" | "cart" | "orders">("scan");
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Scan Specific State
  const [scanMode, setScanMode] = useState<"qr" | "barcode">("qr");
  const [scanValue, setScanValue] = useState("");
  const [scanMessage, setScanMessage] = useState({ text: "", type: "" });
  const [showMockCamera, setShowMockCamera] = useState(false);

  // Checkout Sheet State
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<"none" | "summary" | "processing" | "success" | "failed">("none");
  const [paymentTimer, setPaymentTimer] = useState(0);
  const [paymentTxnId, setPaymentTxnId] = useState("");

  const headers = {
    "x-user-id": currentUser?.userId || "",
    "x-user-role": currentUser?.role || ""
  };

  const fetchCustomerData = async () => {
    try {
      // Fetch Products (to provide instant scan simulation options!)
      const prodRes = await fetch("/api/products", { headers });
      const prodData = await prodRes.json();
      setProducts(prodData);

      // Fetch Active Cart
      const cartRes = await fetch("/api/carts/current", { headers });
      const cartData = await cartRes.json();
      setCart(cartData.cart);
      setCartItems(cartData.items || []);

      // Fetch Past Orders
      const orderRes = await fetch("/api/orders/history", { headers });
      const orderData = await orderRes.json();
      setOrders(orderData);
    } catch (err) {
      console.error("Error loading customer data:", err);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [activeTab, triggerRefreshStamp]);

  // Simulate scanning a specific product
  const handleSimulateScan = async (qrValue: string) => {
    setSubmitting(true);
    setScanMessage({ text: "", type: "" });
    try {
      const res = await fetch("/api/carts/items", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ qrValue })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scan product.");

      setScanMessage({ text: data.message, type: "success" });
      setCart(data.cart);
      setCartItems(data.items);
      
      // Auto flash success check and play sound simulation
      if (navigator.vibrate) navigator.vibrate(200);

      // Auto clear alert
      setTimeout(() => setScanMessage({ text: "", type: "" }), 3000);
      onRefreshGlobal();
    } catch (err: any) {
      setScanMessage({ text: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanValue) return;
    handleSimulateScan(scanValue);
    setScanValue("");
  };

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleDeleteItem(itemId);
      return;
    }
    try {
      const res = await fetch(`/api/carts/items/${itemId}`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ quantity: newQty })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCart(data.cart);
      setCartItems(data.items);
      onRefreshGlobal();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/carts/items/${itemId}`, {
        method: "DELETE",
        headers
      });
      const data = await res.json();
      setCart(data.cart);
      setCartItems(data.items);
      onRefreshGlobal();
    } catch (err) {
      console.error(err);
    }
  };

  // Checkout Trigger (Creates pending order on Express server)
  const handleProceedToCheckout = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      setCheckoutData(data);
      setPaymentStep("summary");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Simulating in-app UPI transaction processing and instant settlement verification
  const handleSimulatePayment = () => {
    setPaymentStep("processing");
    setPaymentTimer(0);
    const mockTxn = `TXN-UPI-${Math.floor(100000 + Math.random() * 900000)}`;
    setPaymentTxnId(mockTxn);

    const interval = setInterval(() => {
      setPaymentTimer((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          completePaymentVerification(mockTxn);
          return 100;
        }
        return prev + 25; // Increment simulated loader
      });
    }, 400);
  };

  const completePaymentVerification = async (txnId: string) => {
    if (!checkoutData?.order?.orderId) return;
    try {
      const res = await fetch(`/api/orders/${checkoutData.order.orderId}/verify-payment`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "success",
          paymentMethod: "UPI In-App",
          transactionId: txnId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentStep("success");
        // Reset local cart state
        setCart(null);
        setCartItems([]);
        onRefreshGlobal();
      } else {
        setPaymentStep("failed");
      }
    } catch (err) {
      console.error("Payment settlement error:", err);
      setPaymentStep("failed");
    }
  };

  const totalCartQty = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
      
      {/* Header */}
      <div className="h-14 bg-slate-950/80 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-teal-400" />
          <div className="text-left">
            <h1 className="text-xs font-bold text-white font-heading truncate max-w-[150px]">
              Customer Checkout
            </h1>
            <p className="text-[9px] text-slate-500 font-mono tracking-wider">SMART QR BILLING</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="text-[10px] font-bold text-rose-400 border border-rose-500/20 px-2 py-1 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 transition-all"
        >
          Exit
        </button>
      </div>

      {/* Primary Container scroll area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* UPI Checkout Sheets & Modals */}
        {paymentStep !== "none" && checkoutData && (
          <div className="absolute inset-0 bg-slate-950/90 z-40 flex flex-col justify-end">
            <div className="bg-slate-900 border-t border-slate-800 rounded-t-[30px] p-6 text-left space-y-4 max-h-[90%] overflow-y-auto">
              
              {paymentStep === "summary" && (
                <>
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-teal-400 bg-teal-400/10 px-3 py-1 rounded-full uppercase tracking-wider">
                      UPI Checkout
                    </span>
                    <h2 className="text-2xl font-bold text-white font-heading mt-2">₹{checkoutData.payableAmount}</h2>
                    <p className="text-xs text-slate-400 mt-1">Paying to merchant: <strong className="text-slate-200">{checkoutData.storeName}</strong></p>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Order Ref:</span>
                      <span className="text-white font-bold">{checkoutData.order.orderId}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Merchant UPI:</span>
                      <span className="text-white">{checkoutData.merchantUpiId}</span>
                    </div>
                  </div>

                  {/* UPI Application Intent Launch simulation buttons */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block text-center">
                      Select UPI App Simulation
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
                        <div key={app} className="p-2 border border-slate-800 rounded-lg text-center bg-slate-950 cursor-pointer hover:border-teal-500/50">
                          <span className="text-[10px] font-bold text-slate-300">{app}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setPaymentStep("none")}
                      className="flex-1 py-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                    >
                      Cancel Bill
                    </button>
                    <button
                      onClick={handleSimulatePayment}
                      className="flex-1 py-3 text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-1"
                    >
                      Pay via UPI App
                    </button>
                  </div>
                </>
              )}

              {paymentStep === "processing" && (
                <div className="text-center py-8 space-y-4">
                  <div className="relative inline-flex p-4 bg-teal-500/10 text-teal-400 rounded-full">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                  <h3 className="text-lg font-bold text-white">UPI Gateway Settlement</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Please do not close the screen. Communicating with National Payments Corporation (NPCI) nodes...
                  </p>
                  
                  {/* Progress Bar indicator */}
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-400 h-full transition-all duration-300"
                      style={{ width: `${paymentTimer}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">TXN REF: {paymentTxnId}</span>
                </div>
              )}

              {paymentStep === "success" && (
                <div className="text-center py-6 space-y-4">
                  <div className="inline-flex p-4 bg-teal-400/20 text-teal-400 rounded-full border border-teal-400/20">
                    <CheckCircle className="w-10 h-10 animate-bounce-gentle" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-heading">Payment Successful!</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Your invoice payment of ₹{checkoutData.payableAmount} to {checkoutData.storeName} is successfully processed. Stock has been deducted.
                  </p>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 text-left font-mono">
                    <p className="text-slate-400">Order ID: <span className="text-white font-bold">{checkoutData.order.orderId}</span></p>
                    <p className="text-slate-400">UPI Ref ID: <span className="text-white">{paymentTxnId}</span></p>
                    <p className="text-slate-400">Merchant UPI: <span className="text-white">{checkoutData.merchantUpiId}</span></p>
                    <p className="text-slate-400">Payment Mode: <span className="text-teal-400 font-bold">UPI INTENT APP</span></p>
                  </div>

                  <button
                    onClick={() => {
                      setPaymentStep("none");
                      setCheckoutData(null);
                      setActiveTab("orders");
                    }}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl"
                  >
                    View Receipt & Bills
                  </button>
                </div>
              )}

              {paymentStep === "failed" && (
                <div className="text-center py-8 space-y-4">
                  <div className="inline-flex p-4 bg-rose-500/10 text-rose-400 rounded-full">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Payment Declined</h3>
                  <p className="text-xs text-slate-400">
                    Simulation returned a signature mismatch or insufficient limit. Please try again.
                  </p>
                  <button
                    onClick={() => setPaymentStep("summary")}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
                  >
                    Retry Settlement
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {activeTab === "scan" && (
          <div className="space-y-4">
            
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setScanMode("qr")}
                className={`py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === "qr"
                    ? "bg-teal-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                QR Code Mode
              </button>
              <button
                type="button"
                onClick={() => setScanMode("barcode")}
                className={`py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === "barcode"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Barcode className="w-3.5 h-3.5" />
                Barcode Mode (EAN/UPC)
              </button>
            </div>

            {/* Upper Viewfinder Graphic */}
            <div className={`relative w-full aspect-[4/3] bg-slate-950 rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col items-center justify-center text-center ${
              scanMode === "barcode" ? "border-indigo-500/30" : "border-teal-500/30"
            }`}>
              
              {scanMode === "qr" ? (
                <>
                  {/* Corner target lines */}
                  <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-teal-400 rounded-tl"></div>
                  <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-teal-400 rounded-tr"></div>
                  <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-teal-400 rounded-bl"></div>
                  <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-teal-400 rounded-br"></div>

                  {/* QR Target Square Frame */}
                  <div className="absolute w-40 h-40 border border-slate-800 rounded-xl flex items-center justify-center">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal-400 rounded-tl"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-teal-400 rounded-tr"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-teal-400 rounded-bl"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal-400 rounded-br"></div>
                  </div>
                  
                  {/* Scanning Laser simulation */}
                  <div className="absolute left-0 right-0 h-[2px] bg-teal-400 shadow-lg shadow-teal-500/50 animate-pulse top-1/2"></div>

                  <div className="z-10 space-y-1 px-4 mt-44">
                    <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1 justify-center">
                      <QrCode className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                      QR Code Reader
                    </h3>
                    <p className="text-[9px] text-slate-500">Align store QR code inside the square target</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Corner target lines */}
                  <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-indigo-400 rounded-tl"></div>
                  <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-indigo-400 rounded-tr"></div>
                  <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-indigo-400 rounded-bl"></div>
                  <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-indigo-400 rounded-br"></div>

                  {/* Barcode Target Wide Frame */}
                  <div className="absolute w-64 h-24 border border-slate-800 rounded-lg flex items-center justify-center bg-slate-950/20">
                    <div className="absolute top-0 left-0 w-4 h-2 border-t-2 border-l-2 border-indigo-400 rounded-tl"></div>
                    <div className="absolute top-0 right-0 w-4 h-2 border-t-2 border-r-2 border-indigo-400 rounded-tr"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-2 border-b-2 border-l-2 border-indigo-400 rounded-bl"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-2 border-b-2 border-r-2 border-indigo-400 rounded-br"></div>
                    
                    {/* Simulated dummy barcode zebra lines background */}
                    <div className="w-full h-12 flex justify-around opacity-15 px-4 items-center">
                      {[1, 2, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2].map((w, idx) => (
                        <div key={idx} className="bg-white h-full" style={{ width: `${w}px` }}></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Red/Crimson horizontal barcode scan laser */}
                  <div className="absolute left-0 right-0 h-[2px] bg-rose-500 shadow-lg shadow-rose-500/50 animate-pulse top-1/2"></div>

                  <div className="z-10 space-y-1 px-4 mt-36">
                    <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1 justify-center">
                      <Barcode className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      EAN/UPC Barcode Reader
                    </h3>
                    <p className="text-[9px] text-slate-500">Align product's manufacturer barcode (EAN/UPC/SKU) within the lens</p>
                  </div>
                </>
              )}
            </div>

            {/* Scan Status Alert Box */}
            {scanMessage.text && (
              <div className={`p-3 rounded-xl border text-xs font-bold text-center flex items-center justify-center gap-2 ${
                scanMessage.type === "success" 
                  ? "bg-teal-500/10 border-teal-500/25 text-teal-300" 
                  : "bg-rose-500/10 border-rose-500/25 text-rose-300"
              }`}>
                {scanMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {scanMessage.text}
              </div>
            )}

            {/* Simulated instant QR/Barcode scan selection tool */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2.5">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                🎯 {scanMode === "qr" ? "QR Code" : "Barcode"} Scan Simulator (Quick Click)
              </span>
              <p className="text-[10px] text-slate-500 leading-normal">
                {scanMode === "qr" 
                  ? "Click any active item below to simulate pointing your device's camera at that item's unique QR code to instantly parse and append to the active invoice!"
                  : "Click any active item below to simulate pointing your device's camera at its standard EAN/UPC barcode (SKU barcode) to parse instantly!"
                }
              </p>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
                {products.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No products configured in owner hub yet.</p>
                ) : (
                  products.map((p) => {
                    const scanValueToUse = scanMode === "qr" ? p.qrCodeValue : p.sku;
                    return (
                      <button
                        key={p.productId}
                        type="button"
                        onClick={() => handleSimulateScan(scanValueToUse)}
                        disabled={submitting}
                        className="w-full text-left p-2.5 bg-slate-900 hover:bg-indigo-950/20 rounded-xl border border-slate-800 hover:border-indigo-500/30 flex items-center justify-between gap-2.5 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={p.imageUrl} alt="" className="w-7 h-7 rounded object-cover" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-white truncate">{p.name}</p>
                            <p className="text-[9px] text-slate-500 font-mono">
                              {scanMode === "qr" ? `QR: ${p.qrCodeValue}` : `Barcode/SKU: ${p.sku}`}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          scanMode === "qr" 
                            ? "text-teal-400 bg-teal-400/10" 
                            : "text-indigo-400 bg-indigo-400/10"
                        }`}>
                          Simulate {scanMode === "qr" ? "QR" : "Barcode"} Scan
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Manual scan value submission */}
            <form onSubmit={handleManualCodeSubmit} className="flex gap-2 text-left">
              <input
                type="text"
                placeholder={scanMode === "qr" ? "Or type raw QR code value..." : "Or type manufacturer product SKU/barcode..."}
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className={`text-white font-bold text-xs px-4 rounded-xl shadow-md transition-all ${
                  scanMode === "qr" ? "bg-teal-600 hover:bg-teal-500" : "bg-indigo-600 hover:bg-indigo-500"
                }`}
              >
                Enter
              </button>
            </form>
          </div>
        )}

        {activeTab === "cart" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">My Active Bill</h3>

            {cartItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto text-slate-600" />
                <p>No scanned products currently on invoice list.</p>
                <button
                  onClick={() => setActiveTab("scan")}
                  className="inline-flex text-xs text-teal-400 font-bold hover:underline"
                >
                  Go scan a product
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                {/* List of Bill Items */}
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <img
                        src={item.productImage}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-800"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{item.productName}</h4>
                        <p className="text-[10px] text-indigo-400 font-bold mt-0.5">₹{item.price}</p>
                      </div>

                      {/* Quantity Modifier */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQty(item.cartItemId, item.quantity - 1)}
                          className="p-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.cartItemId, item.quantity + 1)}
                          className="p-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item.cartItemId)}
                          className="p-1.5 hover:bg-slate-800 text-rose-400 hover:text-rose-300 rounded ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bill Cost Breakdown Card */}
                {cart && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Items Subtotal</span>
                      <span className="text-white">₹{cart.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Discount (promotional)</span>
                      <span className="text-rose-400">-₹{cart.discount}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>GST Tax (calculated)</span>
                      <span className="text-white">₹{cart.tax}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-bold">
                      <span className="text-white">Total Payable</span>
                      <span className="text-teal-400">₹{cart.total}</span>
                    </div>
                  </div>
                )}

                {/* Final Checkout Button */}
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1"
                >
                  Checkout and Pay UPI
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">Purchased Invoice Logs</h3>

            {orders.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">No purchase transactions logged yet.</div>
            ) : (
              <div className="space-y-2">
                {orders.map(o => (
                  <div key={o.orderId} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-3 font-mono">
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-800 pb-2">
                      <div>
                        <p className="font-bold text-teal-400">Invoice: {o.orderId}</p>
                        <p className="text-slate-500 mt-0.5">{new Date(o.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="bg-teal-400/15 text-teal-400 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
                        PAID SUCCESS
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-1">
                      {o.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span className="truncate max-w-[150px]">{it.productName} (x{it.quantity})</span>
                          <span>₹{it.lineTotal}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-800/80 pt-2.5 flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400">Net Settled:</span>
                      <span className="text-teal-400">₹{o.totalAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Mobile Shell Tab Bar */}
      <div className="h-[52px] bg-slate-950/90 border-t border-slate-800/80 grid grid-cols-3 text-[9px] font-bold uppercase tracking-wider select-none shrink-0 z-10">
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex flex-col items-center justify-center gap-1 ${
            activeTab === "scan" ? "text-teal-400" : "text-slate-500 hover:text-white"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Scan QR</span>
        </button>
        <button
          onClick={() => setActiveTab("cart")}
          className={`flex flex-col items-center justify-center gap-1 ${
            activeTab === "cart" ? "text-teal-400" : "text-slate-500 hover:text-white"
          } relative`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>My Bill</span>
          {totalCartQty > 0 && (
            <span className="absolute top-1.5 right-[28px] w-4 h-4 bg-teal-500 text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center">
              {totalCartQty}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex flex-col items-center justify-center gap-1 ${
            activeTab === "orders" ? "text-teal-400" : "text-slate-500 hover:text-white"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoices</span>
        </button>
      </div>

    </div>
  );
}
