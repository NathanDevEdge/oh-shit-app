import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Profile() {
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [salaryType, setSalaryType] = useState<"hourly" | "yearly">("hourly");
  const [salaryAmount, setSalaryAmount] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setSalaryType(profile.salaryType);
      setSalaryAmount(profile.salaryAmount ?? "0");
    }
  }, [profile]);

  const updateSalaryMutation = trpc.profile.updateSalary.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Salary updated!"); },
    onError: (err) => toast.error(err.message),
  });

  const updateNameMutation = trpc.profile.updateName.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Name updated!"); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <div style={pageStyle}><p style={{ color: "#888", textAlign: "center", paddingTop: "4rem" }}>Loading...</p></div>;
  if (!profile) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const promises: Promise<any>[] = [];
    if (name !== (profile.name || "")) promises.push(updateNameMutation.mutateAsync({ name }));
    if (salaryType !== profile.salaryType || salaryAmount !== (profile.salaryAmount ?? "0")) {
      promises.push(updateSalaryMutation.mutateAsync({ salaryType, salaryAmount }));
    }
    if (promises.length === 0) toast.info("No changes to save.");
  };

  const isSaving = updateSalaryMutation.isPending || updateNameMutation.isPending;

  return (
    <div style={pageStyle}>
      <h1 className="gold-text" style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.25rem" }}>Profile</h1>
      <p style={{ color: "#888", marginBottom: "2rem", fontSize: "0.9rem" }}>Update your name and salary settings.</p>

      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #f5c518, #e8a000)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, color: "#1a0a00" }}>
            {(profile.name || profile.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 600 }}>{profile.name || "No name set"}</div>
            <div style={{ color: "#888", fontSize: "0.85rem" }}>{profile.email}</div>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Display Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Salary Type</label>
            <select value={salaryType} onChange={(e) => setSalaryType(e.target.value as "hourly" | "yearly")} style={{ ...inputStyle, background: "oklch(0.12 0.02 290)" }}>
              <option value="hourly">Hourly ($/hr)</option>
              <option value="yearly">Yearly ($/yr)</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Amount ($)</label>
            <input type="number" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} min="0" step="0.01" placeholder={salaryType === "hourly" ? "e.g. 35" : "e.g. 75000"} style={inputStyle} />
          </div>

          <button type="submit" disabled={isSaving} style={{ padding: "0.875rem", borderRadius: "12px", border: "none", background: isSaving ? "rgba(245,197,24,0.4)" : "linear-gradient(135deg, oklch(0.85 0.17 85), oklch(0.65 0.14 75))", color: "oklch(0.1 0.02 290)", fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "1rem", cursor: isSaving ? "not-allowed" : "pointer", marginTop: "0.5rem" }}>
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = { padding: "1.5rem 1rem 6rem", maxWidth: "600px", margin: "0 auto" };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "oklch(1 0 0 / 0.8)" };
const inputStyle: React.CSSProperties = { width: "100%", background: "oklch(0 0 0 / 0.3)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: "12px", padding: "14px", color: "white", fontFamily: "Outfit, sans-serif", fontSize: "1rem", boxSizing: "border-box" };
