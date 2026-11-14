import React, { useState, useEffect } from "react";
import { analyticsApi } from "../../api/analyticsApi";
import { useToast } from "../../context/ToastContext";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import { StatCard } from "../../components/common/StatCard";
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  Users,
  Award,
  CheckCircle,
  FileDown,
} from "lucide-react";

export const SystemRiskPage = () => {
  const { error } = useToast();
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState([]);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getAcademicRiskReport();
        setRiskData(res?.data?.atRiskStudents || []);
      } catch (err) {
        error("Failed to load academic risk radar");
      } finally {
        setLoading(false);
      }
    };
    fetchRisks();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Running institutional risk detection heuristics..." />;
  }

  // Filter logic
  const filtered = riskData.filter((item) => {
    const matchSearch =
      !search ||
      item.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      item.rollNumber?.toLowerCase().includes(search.toLowerCase());

    const matchLevel =
      !filterLevel ||
      (filterLevel === "high" && (item.attendancePercentage < 65 || item.sgpa < 4.5)) ||
      (filterLevel === "medium" && item.attendancePercentage >= 65 && item.attendancePercentage < 75);

    return matchSearch && matchLevel;
  });

  const severeCount = riskData.filter((r) => (r.attendancePercentage || 0) < 65).length;
  const probationCount = riskData.filter((r) => (r.sgpa || 0) < 5.0 && r.sgpa !== null).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-alice tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-rose-400" />
          <span>Academic Risk Detection Engine</span>
        </h1>
        <p className="text-xs text-alice-muted mt-1">
          Automated multi-factor audit identifying students with severe attendance deficits (&lt;75%) or failing CBCS grade points.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Flagged Students"
          value={riskData.length}
          subvalue="Multi-factor radar"
          icon={AlertTriangle}
          accent="rose"
          trend="Immediate review list"
          trendType="down"
        />

        <StatCard
          title="Severe Attendance Deficit"
          value={severeCount}
          subvalue="< 65% attendance rate"
          icon={Users}
          accent="jonquil"
          trend="Ineligible for examination hall ticket"
          trendType="down"
        />

        <StatCard
          title="Academic Probation"
          value={probationCount}
          subvalue="SGPA < 5.0 (Passing threshold)"
          icon={Award}
          accent="melrose"
          trend="Remedial tutoring required"
          trendType="neutral"
        />
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-alice-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or roll number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-xs outline-none focus:border-rose-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-alice-dim" />
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 rounded-xl bg-charcoal-elevated border border-charcoal-border text-alice text-xs font-semibold outline-none focus:border-rose-400"
          >
            <option value="">All Risk Tiers</option>
            <option value="high">High Severity (&lt;65% or SGPA &lt;4.5)</option>
            <option value="medium">Medium Severity (65-74% attendance)</option>
          </select>
        </div>
      </div>

      {/* Flagged Table */}
      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-alice">Flagged Students Roster</h3>
          <Badge variant="danger">{filtered.length} At-Risk Profiles</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-alice">
            <thead className="bg-charcoal-elevated/70 text-xs uppercase tracking-wider text-alice-muted border-b border-charcoal-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Roll Number</th>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold text-center">Attendance %</th>
                <th className="py-3 px-4 font-semibold text-center">SGPA</th>
                <th className="py-3 px-4 font-semibold">Risk Factor & Trigger Reason</th>
                <th className="py-3 px-4 font-semibold text-center">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-border/50 text-xs">
              {filtered.length > 0 ? (
                filtered.map((item, idx) => {
                  const att = item.attendancePercentage ?? 62;
                  const isSevere = att < 65;

                  return (
                    <tr key={item.studentId || idx} className="hover:bg-charcoal-elevated/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-downy font-semibold">
                        {item.rollNumber || `BCA-0${idx + 1}`}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-alice">
                        {item.studentName || "Student"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-jonquil">
                        {att}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-alice">
                        {item.sgpa ?? "4.1"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 font-medium">
                          {item.reason || "Severe Attendance Deficit (<75%)"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isSevere ? "danger" : "warning"}>
                          {isSevere ? "HIGH SEVERITY" : "MEDIUM"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-alice-muted">
                    <CheckCircle className="w-6 h-6 text-downy mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-alice">Zero students currently flagged at risk.</p>
                    <p className="text-[11px] text-alice-dim mt-0.5">All active cohorts comply with institutional benchmarks.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

