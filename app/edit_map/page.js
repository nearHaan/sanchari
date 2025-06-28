import TopBar from "../components/TopBar";
import SideBarEditMap from "../components/SideBarEditMap";

export default function EditMapPage() {
    return (
        <main>
            <div className="flex flex-col h-screen w-screen bg-white">
                <TopBar />
                <div className="relative flex h-screen">
                    <SideBarEditMap/>
                    <div className="absolute inset-0 flex-1 bg-blue-100">
                        //
                    </div>
                </div>
            </div>
        </main>
    );
}