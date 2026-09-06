import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-space-md text-on-surface">
      {/* Header Container */}
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/src/assets/logo.svg" alt="SaveBite Logo" className="h-8 w-auto" />
          </div>
          <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Phase 1 Ready
          </span>
        </div>

        {/* Foundation Status Alert */}
        <div className="bg-primary-fixed/20 border border-primary-fixed-dim/40 rounded-xl p-space-sm flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[24px] shrink-0 mt-0.5">
            verified
          </span>
          <div className="flex flex-col">
            <h2 className="font-title-md text-title-md text-primary font-bold">
              Design System & Foundations Wired
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
              Tailwind CSS has been configured with the Stitch design tokens. Plus Jakarta Sans and Inter typography hierarchies are active.
            </p>
          </div>
        </div>

        {/* Design System Preview / Token Proofs */}
        <div className="flex flex-col gap-space-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
            Token & Typography Verification
          </span>
          
          {/* Color & Currency Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="bg-primary text-on-primary px-3 py-1 rounded-full font-label-sm text-label-sm font-bold shadow-sm">
              Primary (#006030)
            </span>
            <span className="bg-secondary text-on-secondary px-3 py-1 rounded-full font-label-sm text-label-sm font-bold shadow-sm">
              Flash Deal 73% OFF
            </span>
            <span className="bg-surface-container-high text-on-surface px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold">
              Surface Tint
            </span>
          </div>

          {/* Pricing & Currency Verification */}
          <div className="mt-2 p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-outline line-through">₹550 Regular Value</span>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">₹149 Deal Price</span>
            </div>
            <span className="bg-secondary text-on-secondary px-2.5 py-1 rounded-lg font-label-sm text-label-sm font-bold">
              SAVE ₹401
            </span>
          </div>
        </div>

        {/* Next Step Information */}
        <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between text-on-surface-variant">
          <span className="font-body-sm text-body-sm">
            Awaiting user approval for Phase 2
          </span>
          <span className="font-label-sm text-primary font-bold">
            INR (₹) Standard
          </span>
        </div>

      </div>
    </div>
  );
};

export default App;
