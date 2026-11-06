import React, { useState } from 'react';

interface AdminAccount {
  id: string;
  fullName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPLIANCE_ADMIN' | 'FINANCE_ADMIN' | 'OPERATIONS_ADMIN';
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED';
  lastLogin: string;
  twoFactorEnabled: boolean;
}

const INITIAL_ADMINS: AdminAccount[] = [
  {
    id: 'admin-1',
    fullName: 'Master Platform SuperAdmin',
    email: 'admin@savebite.in',
    role: 'SUPER_ADMIN',
    phone: '+91 99999 00001',
    status: 'ACTIVE',
    lastLogin: 'Just now',
    twoFactorEnabled: true,
  },
  {
    id: 'admin-2',
    fullName: 'Priya Sharma (FSSAI Compliance)',
    email: 'compliance@savebite.in',
    role: 'COMPLIANCE_ADMIN',
    phone: '+91 99999 00002',
    status: 'ACTIVE',
    lastLogin: 'Today, 11:20 AM',
    twoFactorEnabled: true,
  },
  {
    id: 'admin-3',
    fullName: 'Arjun Mehta (Settlement & Payouts)',
    email: 'finance@savebite.in',
    role: 'FINANCE_ADMIN',
    phone: '+91 99999 00003',
    status: 'ACTIVE',
    lastLogin: 'Yesterday, 04:15 PM',
    twoFactorEnabled: true,
  },
  {
    id: 'admin-4',
    fullName: 'Rohit Verma (Campus Operations)',
    email: 'operations@savebite.in',
    role: 'OPERATIONS_ADMIN',
    phone: '+91 99999 00004',
    status: 'ACTIVE',
    lastLogin: '2 days ago',
    twoFactorEnabled: false,
  },
];

interface SuperAdminAdminsPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const SuperAdminAdminsPage: React.FC<SuperAdminAdminsPageProps> = ({ onShowToast }) => {
  const [admins, setAdmins] = useState<AdminAccount[]>(INITIAL_ADMINS);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminAccount['role']>('OPERATIONS_ADMIN');
  const [invitePhone, setInvitePhone] = useState('');

  const handleToggleStatus = (adminId: string) => {
    if (adminId === 'admin-1') {
      onShowToast('error', 'Cannot suspend the root SuperAdmin account.', 'Action Forbidden');
      return;
    }
    setAdmins((prev) =>
      prev.map((a) => {
        if (a.id === adminId) {
          const next = a.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          onShowToast('info', `Account ${a.email} is now ${next.toLowerCase()}.`, 'Status Updated');
          return { ...a, status: next };
        }
        return a;
      })
    );
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      onShowToast('error', 'Please provide a valid name and email.', 'Validation Error');
      return;
    }

    const newAdmin: AdminAccount = {
      id: `admin-${Date.now()}`,
      fullName: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      phone: invitePhone.trim() || '+91 99999 00000',
      status: 'ACTIVE',
      lastLogin: 'Invited (Pending First Login)',
      twoFactorEnabled: true,
    };

    setAdmins((prev) => [...prev, newAdmin]);
    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInvitePhone('');
    onShowToast('success', `Administrator invite issued to ${newAdmin.email}`, 'Admin Created');
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-purple-400 text-3xl">admin_panel_settings</span>
            <h1 className="text-2xl font-bold text-white">Administrator Access & Roles</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Configure administrative security clearances, staff roles, and multi-factor authorization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInviteModalOpen(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Invite Administrator
        </button>
      </div>

      {/* Admin Accounts Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400">badge</span>
          Registered Platform Administrators ({admins.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold text-xs uppercase">
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Role & Clearance</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">2FA Status</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-850/60 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-bold text-white flex items-center gap-1.5">
                        {adm.fullName}
                        {adm.role === 'SUPER_ADMIN' && (
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800/80">
                            Root
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">{adm.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-semibold text-slate-300">
                      {adm.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-400">{adm.phone}</td>
                  <td className="py-3 px-4">
                    {adm.twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        <span className="material-symbols-outlined text-[16px]">verified_user</span>
                        Enforced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">{adm.lastLogin}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        adm.status === 'ACTIVE'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950/80 text-red-400 border border-red-800'
                      }`}
                    >
                      {adm.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {adm.id !== 'admin-1' && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(adm.id)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${
                          adm.status === 'ACTIVE'
                            ? 'border-red-900/80 text-red-400 hover:bg-red-950'
                            : 'border-emerald-900/80 text-emerald-400 hover:bg-emerald-950'
                        }`}
                      >
                        {adm.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400">person_add</span>
                Invite Platform Administrator
              </h3>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Nair"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="staff@savebite.in"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Administrative Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm"
                >
                  <option value="OPERATIONS_ADMIN">Campus Operations Admin</option>
                  <option value="COMPLIANCE_ADMIN">Compliance & FSSAI Officer</option>
                  <option value="FINANCE_ADMIN">Finance & Settlements Admin</option>
                  <option value="SUPER_ADMIN">Full SuperAdmin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98200 00000"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAdminsPage;
