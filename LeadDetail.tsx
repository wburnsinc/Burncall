import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Shield, Mail } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface InviteResult extends TeamMember {
  inviteToken: string;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-[#FF6B2B]/20 text-[#FF6B2B] border-[#FF6B2B]/30",
  dispatcher: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  technician: "bg-green-500/20 text-green-400 border-green-500/30",
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function Team() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("technician");
  const [sending, setSending] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api.get<{ members: TeamMember[] }>("/api/team");
      setMembers(data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sendInvite = async () => {
    if (!inviteEmail || !inviteName) return;
    setSending(true);
    try {
      const result = await api.post<InviteResult>("/api/team", { name: inviteName, email: inviteEmail, role: inviteRole });
      setLastInviteLink(`${window.location.origin}/accept-invite?token=${result.inviteToken}`);
      setInviteName("");
      setInviteEmail("");
      setInviting(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const removeMember = async (id: number) => {
    try {
      await api.delete(`/api/team/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove team member");
    }
  };

  if (loading) return <div className="text-slate-400 text-sm p-6">Loading team…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-slate-400 text-sm mt-0.5">{members.length + 1} people on your account</p>
        </div>
        <Button className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white" onClick={() => setInviting(true)} data-testid="invite-member">
          <Plus className="h-4 w-4 mr-2" /> Invite Member
        </Button>
      </div>
      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      {lastInviteLink && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-5 flex items-center gap-3 flex-wrap">
          <p className="text-green-300 text-xs flex-1 min-w-[200px]">
            Invite sent. If email delivery isn't configured yet, share this link directly:{" "}
            <code className="text-green-200 break-all">{lastInviteLink}</code>
          </p>
          <Button size="sm" variant="outline" className="border-green-500/30 text-green-300 text-xs h-7 shrink-0" onClick={() => { navigator.clipboard.writeText(lastInviteLink); }}>Copy</Button>
          <button className="text-green-500 text-xs shrink-0" onClick={() => setLastInviteLink(null)}>Dismiss</button>
        </div>
      )}

      {inviting && (
        <div className="bg-[#0A0F1E] border border-[#FF6B2B]/30 rounded-2xl p-5 mb-5">
          <p className="text-white font-semibold mb-4">Invite a team member</p>
          <p className="text-xs text-slate-500 mb-3">Sends a real email invite via Resend (if configured) and adds them to your roster.</p>
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="Full name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 min-w-[160px]" />
            <Input placeholder="Email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 flex-1 min-w-[200px]" data-testid="invite-email" />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" data-testid="invite-role">
              <option value="admin">Admin</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="technician">Technician</option>
            </select>
            <Button className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white text-sm" disabled={sending} onClick={sendInvite}>{sending ? "Sending…" : "Send Invite"}</Button>
            <Button variant="outline" className="border-white/20 text-white text-sm" onClick={() => setInviting(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl overflow-hidden mb-8">
        <div className="p-4 border-b border-white/10">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Members</p>
        </div>

        {/* Owner — the authenticated account holder, always present */}
        {user && (
          <div className="flex items-center gap-4 p-5 border-b border-white/5">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6B2B]/60 to-orange-700/60 flex items-center justify-center text-white font-bold text-sm shrink-0">{user.name.slice(0, 2).toUpperCase()}</div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{user.name}</p>
              <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5"><Mail className="h-3 w-3" /> {user.email}</p>
            </div>
            <Badge className={`${ROLE_COLORS.owner} text-xs border`}>Owner</Badge>
          </div>
        )}

        {members.map((member, i) => (
          <div key={member.id} className={`flex items-center gap-4 p-5 ${i < members.length - 1 ? "border-b border-white/5" : ""}`}>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold text-sm shrink-0">{member.name.slice(0, 2).toUpperCase()}</div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{member.name}</p>
              <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5"><Mail className="h-3 w-3" /> {member.email}</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className={`h-1.5 w-1.5 rounded-full ${member.status === "active" ? "bg-green-400" : "bg-slate-600"}`} />
              <span className="text-slate-500 text-xs capitalize">{member.status}</span>
            </div>
            <Badge className={`${ROLE_COLORS[member.role] || ROLE_COLORS.technician} text-xs border capitalize`}>{member.role}</Badge>
            <button onClick={() => removeMember(member.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1" data-testid={`remove-member-${member.id}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {members.length === 0 && <p className="text-center text-slate-600 text-sm py-6">No team members invited yet.</p>}
      </div>

      <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="h-5 w-5 text-[#FF6B2B]" />
          <p className="text-white font-semibold">Role Permissions</p>
        </div>
        <p className="text-xs text-slate-500 mb-4">Enforced by the API — a non-owner/admin trying a restricted action gets a real 403, not just a hidden button.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left pb-3">Permission</th>
                <th className="text-center pb-3">Owner</th>
                <th className="text-center pb-3">Admin</th>
                <th className="text-center pb-3">Dispatcher</th>
                <th className="text-center pb-3">Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ["View & manage all leads", true, true, true, false],
                ["Take over conversations", true, true, true, true],
                ["Manage automations", true, true, false, false],
                ["View revenue dashboard", true, true, false, false],
                ["Manage team members", true, true, false, false],
                ["Billing & subscription", true, false, false, false],
                ["Knowledge base editing", true, true, true, false],
              ].map(([perm, ...roles]) => (
                <tr key={String(perm)}>
                  <td className="py-3 text-slate-300">{perm}</td>
                  {roles.map((allowed, j) => (
                    <td key={j} className="text-center py-3">
                      <span className={allowed ? "text-green-400" : "text-slate-700"}>{allowed ? "✓" : "–"}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
