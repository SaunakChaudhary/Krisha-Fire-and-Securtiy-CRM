import { useEffect, useState, useContext } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import EngineerNavbar from "../../components/Engineer/EngineerNavbar";
import { AuthContext } from "../../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const EngineerCalendar = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Map API status → color
    const getStatusColor = (status) => {
        switch (status) {
            case "completed":
                return "#16a34a"; // green
            case "on-site":
                return "#f97316"; // orange
            case "on-route":
                return "#eab308"; // yellow
            case "accepted":
                return "#7c3aed"; // purple
            case "scheduled":
            default:
                return "#2563eb"; // blue
        }
    };

    useEffect(() => {
        const fetchEngineerTasks = async () => {
            try {
                setLoading(true);

                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/diary/entries`
                );
                const data = await res.json();

                if (!data.success) {
                    throw new Error("Failed to fetch diary entries");
                }

                const engineerId = user?.user?._id;
                console.log(engineerId)

                const engineerEvents = data.data
                    .filter(
                        (entry) =>
                            entry.engineer?._id?.toString() === engineerId?.toString()
                    )
                    .map((entry) => ({
                        id: entry._id,
                        title: `Call #${entry.callLog?.call_number} - ${entry.site?.site_code}`,
                        start: new Date(entry.date).toISOString().split("T")[0],
                        allDay: true,
                        backgroundColor: getStatusColor(entry.status),
                        borderColor: getStatusColor(entry.status),
                        extendedProps: {
                            site: entry.site?.site_name,
                            status: entry.status,
                        },
                    }));
                setEvents(engineerEvents);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load calendar");
            } finally {
                setLoading(false);
            }
        };

        if (user?.user?._id) {
            fetchEngineerTasks();
        }
    }, [user]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Navbar */}
            <EngineerNavbar />

            {/* Main Content */}
            <main className="flex-1 p-6">
                <div className="bg-white rounded-xl shadow p-4">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        My Work Calendar
                    </h2>

                    {loading ? (
                        <p className="text-gray-500">Loading calendar...</p>
                    ) : (
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={events}
                            height="auto"
                            headerToolbar={{
                                left: "prev,next today",
                                right: "title",
                            }}
                            eventClick={(info) => {
                                // Navigate to task details
                                navigate(`/engineer/task/${info.event.id}`);
                            }}
                            eventContent={(arg) => (
                                <div
                                    className="text-[11px] leading-tight truncate"
                                    title={`${arg.event.title}`}
                                >
                                    <div className="font-semibold">
                                        {arg.event.title}
                                    </div>
                                </div>
                            )}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default EngineerCalendar;
