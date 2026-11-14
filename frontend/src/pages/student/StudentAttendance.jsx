import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { attendanceApi } from "../../api/attendanceApi";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import {
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Calculator,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

export const StudentAttendance = () => {
  const { user, profile } = useAuth();
  const { error } = useToast();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [recoveryData, setRecoveryData] = useState([]);
  const [simulateClasses, setSimulateClasses] = useState(5);

  const studentId = profile?._id || user?.studentProfile?._id || profile?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [sumRes, recRes] = await Promise.allSettled([
          attendanceApi.getStudentSummary(studentId),
          attendanceApi.getPredictiveRecovery(studentId),
        ]);

        if (sumRes.status === "fulfilled") {
          setSummary(sumRes.value?.data?.summary || null);
        }
        if (recRes.status === "fulfilled") {
          setRecoveryData(recRes.value?.data?.predictions || []);
        }
      } catch (err) {
        error("Failed to load attendance analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  if (loading) {
    return <LoadingSpinner label="Calculating attendance statistics and recovery models..." />;
  }

  const subjectList = summary?.subjectWise || [];
  const overallPct = summary?.overallPercentage ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-alice tracking-tight">
          Attendance Analytics & Recovery Forecast
        </h1>
        <p className="text-xs text-alice-muted mt-1">
          Monitor your attendance percentage and simulate upcoming class attendance to stay above the 75% threshold.
        </p>
      </div>

      {/* Predictive Recovery Calculator Hero Box */}
      <div className="relative overflow-hidden rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-5">
        <div className="absolute top-0 right-0 w-72 h-72 bg-jonquil/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-charcoal-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-jonquil/10 border border-jonquil/30 text-jonquil">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-alice">Predictive Class Recovery Engine</h2>
              <p className="text-xs text-alice-muted">
                Formula-driven recovery forecasting to achieve the mandatory 75% attendance threshold.
              </p>
            </div>
          </div>
          <Badge variant={overallPct >= 75 ? "downy" : "jonquil"}>
            Threshold: 75%
          </Badge>
        </div>

        {/* Forecast Cards per Subject */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recoveryData && recoveryData.length > 0 ? (
            recoveryData.map((item, idx) => {
              const current = item.currentPercentage || 0;
              const needed = item.classesNeededToReach75 || 0;
              const isSafe = current >= 75;

              return (
                <div
                  key={item.subjectId || idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSafe
                      ? "bg-charcoal-elevated/40 border-charcoal-border"
                      : "bg-charcoal-elevated border-jonquil/40 shadow-lg shadow-jonquil/5"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal text-alice-muted">
                        {item.subjectCode || "SUB"}
                      </span>
                      <h4 className="text-sm font-bold text-alice mt-1">
                        {item.subjectName || "Subject"}
                      </h4>
                    </div>
                    <Badge variant={isSafe ? "downy" : "jonquil"}>
                      {current}%
                    </Badge>
                  </div>

                  <div className="mt-4 pt-3 border-t border-charcoal-border/60 text-xs">
                    {isSafe ? (
                      <div className="flex items-center gap-2 text-downy font-medium">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Attendance threshold met. Maintain regular attendance.</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-jonquil font-bold">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Must attend next {needed} consecutive class{needed > 1 ? "es" : ""}</span>
                        </div>
                        <p className="text-[11px] text-alice-dim leading-snug">
                          Missing another session will increase required recovery classes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-6 text-center text-alice-muted text-xs">
              No predictive shortage data recorded for current courses.
            </div>
          )}
        </div>

        {/* Interactive Future Attendance Simulator */}
        <div className="pt-4 border-t border-charcoal-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-alice-muted">
            <Sparkles className="w-4 h-4 text-downy shrink-0" />
            <span>
              Interactive Simulator: If you attend the next <strong>{simulateClasses}</strong> sessions continuously:
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-alice-dim">Simulate next classes:</span>
            <div className="flex items-center gap-1">
              {[3, 5, 8, 12].map((n) => (
                <button
                  key={n}
                  onClick={() => setSimulateClasses(n)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    simulateClasses === n
                      ? "bg-downy text-charcoal shadow-sm shadow-downy/30"
                      : "bg-charcoal-elevated text-alice-muted hover:text-alice border border-charcoal-border"
                  }`}
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Attendance Records Table */}
      <div className="rounded-3xl bg-charcoal-card border border-charcoal-border p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-alice">Subject Attendance Breakdown</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-alice">
            <thead className="bg-charcoal-elevated/70 text-xs uppercase tracking-wider text-alice-muted border-b border-charcoal-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Subject</th>
                <th className="py-3 px-4 font-semibold text-center">Total Sessions</th>
                <th className="py-3 px-4 font-semibold text-center">Attended</th>
                <th className="py-3 px-4 font-semibold text-center">Missed</th>
                <th className="py-3 px-4 font-semibold text-center">Percentage</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-border/50 text-xs">
              {subjectList.length > 0 ? (
                subjectList.map((s, idx) => {
                  const pct = s.percentage || 0;
                  const isEligible = pct >= 75;
                  const missed = (s.total || 0) - (s.attended || 0);

                  return (
                    <tr key={s.subjectId || idx} className="hover:bg-charcoal-elevated/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-bold text-alice">{s.subjectName || "Subject"}</div>
                        <div className="text-[11px] text-alice-dim font-mono">{s.subjectCode}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">{s.total}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-downy font-semibold">
                        {s.attended}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-rose-400">
                        {missed}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-mono font-bold ${isEligible ? "text-downy" : "text-jonquil"}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isEligible ? "downy" : "warning"}>
                          {isEligible ? "ELIGIBLE" : "SHORTAGE"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-alice-muted">
                    No attendance records found for this semester.
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
