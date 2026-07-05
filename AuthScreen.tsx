import React, { useState } from "react";
import {
  Smartphone,
  Layers,
  Columns,
  HelpCircle,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  FileText,
  CreditCard,
  QrCode
} from "lucide-react";
import MobileFrame from "./components/MobileFrame";
import AuthScreen from "./components/AuthScreen";
import OwnerDashboard from "./components/OwnerDashboard";
import CustomerDashboard from "./components/CustomerDashboard";

export default function App() {
  const [workspaceMode, setWorkspaceMode] = useState<"single" | "split">("split");
  const [singleActiveRole, setSingleActiveRole] = useState<"owner" | "customer">("owner");

  // Phone 1 (Owner) Session State
  const [ownerUser, setOwnerUser] = useState<any>(null);
  const [ownerStore, setOwnerStore] = useState<any>(null);

  // Phone 2 (Customer) Session State
  const [customerUser, setCustomerUser] = useState<any>(null);

  // Trigger stamp to force updates between the split simulators
  const [triggerRefreshStamp, setTriggerRefreshStamp] = useState(0);

  const handleRefreshGlobal = () => {
    setTriggerRefreshStamp(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
      
      {/* Top Navigation / Branding */}
      <header className="h-16 bg-slate-950 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30">
            <QrCode className="w-5 h-5 text-white animate-pulse-slow" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-bold font-heading text-white tracking-tight">
              Smart QR Billing & Store Management
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">FULL-STACK APP SANDBOX</p>
          </div>
        </div>

        {/* Layout Switcher Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setWorkspaceMode("single")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              workspaceMode === "single"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Single View
          </button>
          <button
            onClick={() => setWorkspaceMode("split")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              workspaceMode === "split"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Dual Split Sandbox
          </button>
        </div>
      </header>

      {/* Workspace Inner Sandbox Container */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left Informational Walkthrough Sidebar */}
        <aside className="w-full lg:w-80 bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-5 overflow-y-auto space-y-5 text-left shrink-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider font-heading">Interactive Guide</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Test the complete mobile cashier flow live inside your browser frame:
            </p>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/50 text-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-600/10 rounded-bl-2xl flex items-center justify-center font-bold text-indigo-400 font-mono">
                1
              </div>
              <h3 className="font-bold text-white flex items-center gap-1.5">
                🏪 Store Setup
              </h3>
              <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed">
                Log into <strong>Owner Mode</strong> (use <em>Owner Demo</em> button for instant access). Add products, adjust prices, categories, and GST values.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/50 text-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-teal-500/10 rounded-bl-2xl flex items-center justify-center font-bold text-teal-400 font-mono">
                2
              </div>
              <h3 className="font-bold text-white flex items-center gap-1.5">
                🛍️ Scans & Bills
              </h3>
              <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed">
                Log into <strong>Customer Mode</strong> (use <em>Customer Demo</em>). Tap any product in the <strong>Scan Simulator</strong> panel to mock a camera scan. Items will immediately populate the live invoice.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/50 text-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-bl-2xl flex items-center justify-center font-bold text-emerald-400 font-mono">
                3
              </div>
              <h3 className="font-bold text-white flex items-center gap-1.5">
                💸 Instant UPI Payout
              </h3>
              <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed">
                Click checkout and pay. Settlement routes directly to the owner's payout UPI address (configured in settings). After payment success, inventory stock levels decrement, and the owner receives immediate low stock warnings!
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/50 text-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-bl-2xl flex items-center justify-center font-bold text-amber-400 font-mono">
                4
              </div>
              <h3 className="font-bold text-white flex items-center gap-1.5">
                🧠 Gemini AI Coach
              </h3>
              <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed">
                Go to the Owner's <strong>AI Coach</strong> tab and click <em>Analyze</em>. Our server-side Gemini Flash LLM will evaluate stock warnings, suggest order items, and offer layout advice.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1 font-mono">
            <p>✔ Pro Bundle Activated</p>
            <p>✔ Camera Scan Enabled</p>
            <p>✔ PDF Catalog compilable</p>
          </div>
        </aside>

        {/* Center Canvas housing phone previews */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center bg-slate-900/50">
          
          {workspaceMode === "split" ? (
            /* Split layout: Both phone frames rendered side-by-side! */
            <div className="w-full flex flex-col md:flex-row justify-center items-stretch gap-8 max-w-4xl">
              
              {/* Left Phone Frame: OWNER App */}
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest mb-3">
                  🏪 Owner Device Frame
                </span>
                <MobileFrame
                  activeRole="owner"
                  onRoleSwitch={(r) => {
                    if (r === "customer") setWorkspaceMode("single");
                    setSingleActiveRole(r);
                  }}
                  currentUser={ownerUser}
                  onLogout={() => setOwnerUser(null)}
                >
                  {ownerUser ? (
                    <OwnerDashboard
                      store={ownerStore}
                      currentUser={ownerUser}
                      onLogout={() => setOwnerUser(null)}
                      onRefreshGlobal={handleRefreshGlobal}
                    />
                  ) : (
                    <AuthScreen
                      onLoginSuccess={(user, store) => {
                        setOwnerUser(user);
                        setOwnerStore(store);
                        handleRefreshGlobal();
                      }}
                    />
                  )}
                </MobileFrame>
              </div>

              {/* Right Phone Frame: CUSTOMER App */}
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest mb-3">
                  🛍️ Customer Device Frame
                </span>
                <MobileFrame
                  activeRole="customer"
                  onRoleSwitch={(r) => {
                    if (r === "owner") setWorkspaceMode("single");
                    setSingleActiveRole(r);
                  }}
                  currentUser={customerUser}
                  onLogout={() => setCustomerUser(null)}
                >
                  {customerUser ? (
                    <CustomerDashboard
                      currentUser={customerUser}
                      onLogout={() => setCustomerUser(null)}
                      onRefreshGlobal={handleRefreshGlobal}
                      triggerRefreshStamp={triggerRefreshStamp}
                    />
                  ) : (
                    <AuthScreen
                      onLoginSuccess={(user, store) => {
                        setCustomerUser(user);
                        handleRefreshGlobal();
                      }}
                    />
                  )}
                </MobileFrame>
              </div>

            </div>
          ) : (
            /* Single Device Layout */
            <div className="w-full max-w-sm">
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest block max-w-max mx-auto mb-3">
                Simulated {singleActiveRole === "owner" ? "Owner Hub" : "Customer App"}
              </span>
              
              <MobileFrame
                activeRole={singleActiveRole}
                onRoleSwitch={(role) => setSingleActiveRole(role)}
                currentUser={singleActiveRole === "owner" ? ownerUser : customerUser}
                onLogout={() => {
                  if (singleActiveRole === "owner") setOwnerUser(null);
                  else setCustomerUser(null);
                }}
              >
                {singleActiveRole === "owner" ? (
                  ownerUser ? (
                    <OwnerDashboard
                      store={ownerStore}
                      currentUser={ownerUser}
                      onLogout={() => setOwnerUser(null)}
                      onRefreshGlobal={handleRefreshGlobal}
                    />
                  ) : (
                    <AuthScreen
                      onLoginSuccess={(user, store) => {
                        setOwnerUser(user);
                        setOwnerStore(store);
                        handleRefreshGlobal();
                      }}
                    />
                  )
                ) : (
                  customerUser ? (
                    <CustomerDashboard
                      currentUser={customerUser}
                      onLogout={() => setCustomerUser(null)}
                      onRefreshGlobal={handleRefreshGlobal}
                      triggerRefreshStamp={triggerRefreshStamp}
                    />
                  ) : (
                    <AuthScreen
                      onLoginSuccess={(user, store) => {
                        setCustomerUser(user);
                        handleRefreshGlobal();
                      }}
                    />
                  )
                )}
              </MobileFrame>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
