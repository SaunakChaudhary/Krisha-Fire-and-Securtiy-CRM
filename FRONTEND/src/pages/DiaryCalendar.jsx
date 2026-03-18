import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

// ✅ Fix: Format date as local YYYY-MM-DD without UTC conversion
const toLocalDateStr = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DiaryCalendar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [systemDetails, setSystemDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getNextServiceDates = (startDate, endDate, frequency) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let monthsToAdd = 0;
    switch (frequency) {
      case "Monthly":      monthsToAdd = 1;  break;
      case "Bi-Monthly":   monthsToAdd = 2;  break;
      case "Quarterly":    monthsToAdd = 3;  break;
      case "Half-Yearly":  monthsToAdd = 6;  break;
      case "Yearly":       monthsToAdd = 12; break;
      default: return dates;
    }

    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setMonth(current.getMonth() + monthsToAdd);
    }
    return dates;
  };

  const getSystemDetails = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/systems`);
      if (!res.ok) throw new Error("Failed to fetch system details");
      const data = await res.json();
      setSystemDetails(data.systems);
    } catch (err) {
      console.error("System fetch error:", err);
    }
  };

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      // Fetch diary assignments
      const diaryRes = await fetch(`${import.meta.env.VITE_API_URL}/diary/entries`);
      if (!diaryRes.ok) throw new Error("Failed to fetch diary entries");
      const diaryData = await diaryRes.json();

      const assignmentEvents = (diaryData.data || []).map((a) => ({
        id: a._id,
        title: `📋 #${a.callLog.call_number} — ${a.engineer.firstname} ${a.engineer.lastname}`,
        // ✅ Fix: Use toLocalDateStr to avoid UTC shift
        start: toLocalDateStr(a.date),
        allDay: true,
        backgroundColor: "#2563eb",
        borderColor: "#1d4ed8",
        textColor: "#ffffff",
        extendedProps: { type: "assignment" },
      }));

      // Fetch sites for AMC events
      const siteRes = await fetch(`${import.meta.env.VITE_API_URL}/sites`);
      const sitesData = await siteRes.json();
      const amcEvents = [];

      sitesData.forEach((site) => {
        site.site_systems.forEach((system) => {
          if (system.amc_start_date && system.amc_end_date && system.frequency) {
            const serviceDates = getNextServiceDates(
              system.amc_start_date,
              system.amc_end_date,
              system.frequency
            );

            const systemName =
              systemDetails.find((s) => s._id === system.system_id)?.systemName || "";

            serviceDates.forEach((date, index) => {
              amcEvents.push({
                id: `${site._id}-${system._id}-${index}`,
                // ✅ Fix: Use toLocalDateStr to avoid UTC shift
                start: toLocalDateStr(date),
                allDay: true,
                backgroundColor: "#16a34a",
                borderColor: "#15803d",
                textColor: "#ffffff",
                extendedProps: {
                  type: "amc",
                  site: site.site_name,
                  siteCode: site.site_code,
                  frequency: system.frequency,
                  systemName,
                  systemId: system.system_id?.systemCode,
                },
              });
            });
          }
        });
      });

      setEvents([...assignmentEvents, ...amcEvents]);
    } catch (err) {
      console.error("Calendar fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSystemDetails();
  }, []);

  useEffect(() => {
    if (systemDetails.length > 0) {
      fetchCalendarData();
    }
  }, [systemDetails]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 mt-20 p-4 lg:pl-72">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Service Diary</h1>
            <p className="text-sm text-gray-500">Track assignments and AMC service schedules</p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
              <span className="text-sm text-gray-600">Engineer Assignment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-600 inline-block"></span>
              <span className="text-sm text-gray-600">AMC Service Due</span>
            </div>
          </div>

          {/* Calendar Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={events}
                height="auto"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "",
                }}
                buttonText={{ today: "Today" }}
                dayMaxEvents={3}
                moreLinkText={(num) => `+${num} more`}
                dateClick={(info) => {
                  navigate(`/manage-diary?date=${info.dateStr}`);
                }}
                eventClick={(info) => {
                  info.jsEvent.preventDefault();
                  if (info.event.extendedProps.type === "amc") return;
                  navigate(`/manage-diary?date=${info.event.startStr}`);
                }}
                eventContent={(arg) => {
                  const isAmc = arg.event.extendedProps.type === "amc";
                  const title = isAmc
                    ? `🔧 ${arg.event.extendedProps.frequency} — ${arg.event.extendedProps.siteCode} ${arg.event.extendedProps.systemName}`
                    : arg.event.title;

                  return (
                    <div
                      className="px-1 py-0.5 rounded text-xs font-medium truncate w-full cursor-pointer"
                      title={title}
                      style={{
                        backgroundColor: arg.event.backgroundColor,
                        color: arg.event.textColor || "#fff",
                        border: `1px solid ${arg.event.borderColor}`,
                      }}
                    >
                      {title}
                    </div>
                  );
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DiaryCalendar;