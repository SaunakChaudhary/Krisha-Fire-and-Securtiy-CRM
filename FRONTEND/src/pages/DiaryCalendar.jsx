import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

const DiaryCalendar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  const getNextServiceDates = (startDate, endDate, frequency) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let monthsToAdd = 0;

    switch (frequency) {
      case "Monthly":
        monthsToAdd = 1;
        break;
      case "Quarterly":
        monthsToAdd = 3;
        break;
      case "Half-Yearly":
        monthsToAdd = 6;
        break;
      case "Yearly":
        monthsToAdd = 12;
        break;
      default:
        return dates;
    }

    let current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setMonth(current.getMonth() + monthsToAdd);
    }

    return dates;
  };

  const fetchCalendarData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/diary/entries`);
      if (!res.ok) throw new Error("Failed to fetch diary entries");

      const data = await res.json();

      const assignmentEvents = (data.data || []).map(a => ({
        id: a._id,
        title: `#${a.callLog.call_number} - ${a.engineer.firstname} ${a.engineer.lastname}`,
        start: new Date(a.date).toISOString(),
        allDay: true
      }));

      const siteEvents = await fetch(`${import.meta.env.VITE_API_URL}/sites`);
      const data1 = await siteEvents.json();
      const amcEvents = [];

      data1.forEach(site => {
        site.site_systems.forEach(system => {
          if (
            system.amc_start_date &&
            system.amc_end_date &&
            system.frequency
          ) {
            const serviceDates = getNextServiceDates(
              system.amc_start_date,
              system.amc_end_date,
              system.frequency
            );


            serviceDates.forEach((date, index) => {
              amcEvents.push({
                id: `${site._id}-${system._id}-${index}`,
                title: `Next Service (${system.frequency}) - ${site.site_code}`,
                start: date.toISOString().split("T")[0],
                allDay: true,
                backgroundColor: "#16a34a",
                borderColor: "#16a34a",
                extendedProps: {
                  site: site.site_code,
                  frequency: system.frequency,
                  systemId: system.system_id?.systemCode
                }
              });
            });
          }
        });
      });

      // 3️⃣ Merge both
      setEvents([...assignmentEvents, ...amcEvents]);
    } catch (err) {
      console.error("Calendar fetch error:", err);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(false)}
        />
        <main className="flex-1 mt-20 p-4 lg:pl-72">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            height="auto"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: ""
            }}
            buttonText={{
              today: "Today"
            }}
            dateClick={(info) => {
              navigate(`/manage-diary?date=${info.dateStr}`);
            }}
            eventClick={(info) => {
              info.jsEvent.preventDefault();
              const date = new Date(info.event.startStr);
              if (info.event.extendedProps.frequency)
                return;
              navigate(`/manage-diary?date=${date.toISOString().split("T")[0]}`);
            }}

            eventContent={(arg) => (
              <div className="leading-tight overflow-hidden" title={arg.event.title}>
                <div className="font-semibold truncate">
                  {arg.event.title}
                </div>
              </div>
            )}
          />
        </main>
      </div>
    </div>
  );
};

export default DiaryCalendar;
