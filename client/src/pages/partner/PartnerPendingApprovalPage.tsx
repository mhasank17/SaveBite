import React from 'react';
import Logo from '../../components/common/Logo';
import { PartnerRestaurantInfo } from '../../services/authApi';
import Button from '../../components/common/Button';

interface PartnerPendingApprovalPageProps {
  restaurant: PartnerRestaurantInfo;
  onRefresh: () => void;
  onLogout: () => void;
}

export const PartnerPendingApprovalPage: React.FC<PartnerPendingApprovalPageProps> = ({
  restaurant,
  onRefresh,
  onLogout,
}) => {
  const isRejected = restaurant.kycStatus === 'REJECTED';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10 text-center">
        {/* Brand */}
        <Logo className="h-9 mx-auto mb-6" />

        {/* Status Icon */}
        <div
          className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5 ${
            isRejected
              ? 'bg-red-100 text-red-600'
              : 'bg-amber-100 text-amber-700 animate-pulse'
          }`}
        >
          <span className="material-symbols-outlined text-[36px]">
            {isRejected ? 'cancel' : 'pending_actions'}
          </span>
        </div>

        {/* Status Title & Message */}
        <div className="mb-6">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              isRejected
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {isRejected ? 'Application Rejected' : 'Application Pending Approval'}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isRejected ? 'Application Action Required' : 'Under SuperAdmin Review'}
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            {isRejected
              ? 'Your restaurant application could not be verified by University SuperAdmin. Please review the details below or contact support.'
              : 'Your restaurant registration is currently pending review by the University Administration team to verify FSSAI compliance.'}
          </p>
        </div>

        {/* Application Summary Box */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left mb-6 space-y-3">
          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
            <span className="text-slate-500">Restaurant</span>
            <span className="font-bold text-slate-900">{restaurant.name}</span>
          </div>

          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
            <span className="text-slate-500">Branch</span>
            <span className="font-medium text-slate-800">{restaurant.branchName}</span>
          </div>

          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
            <span className="text-slate-500">FSSAI License</span>
            <span className="font-mono font-bold text-slate-900">{restaurant.licenseNumber}</span>
          </div>

          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
            <span className="text-slate-500">Store Address</span>
            <span className="text-slate-700 text-right max-w-[220px] truncate">
              {restaurant.address}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Service Area Delivery Commitment</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span>Enforced</span>
            </span>
          </div>
        </div>

        {/* SuperAdmin Approval Notice */}
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs text-left mb-6 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-blue-600 shrink-0 text-[18px]">
            info
          </span>
          <div className="leading-relaxed">
            Once an administrator verifies and approves your application in the <strong>Admin Portal</strong>, your store will immediately unlock deal publishing, inventory control, and customer meal orders.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <Button
            variant="primary"
            onClick={onRefresh}
            leftIcon={<span className="material-symbols-outlined text-[18px]">refresh</span>}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-xs"
          >
            Check Status Again
          </Button>

          <Button
            variant="outline"
            onClick={onLogout}
            className="text-slate-600 border-slate-200 hover:bg-slate-100 py-2.5 rounded-xl text-sm"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PartnerPendingApprovalPage;
