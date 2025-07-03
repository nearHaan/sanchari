import { AddNodeIcon, AttributeIcon, CancelIcon, DeleteNodeIcon, DetectIcon, ExitIcon, HandDrawIcon, LogIcon, MapIcon, MergeNodeIcon, MoveNodeIcon, PolygonIcon, RedoIcon, RemoveIcon, SaveIcon, SelectIcon, SettingsIcon, ShootIcon, SpanIcon, UndoIcon, ZoomInIcon, ZoomOutIcon } from "./Icons";
import EditMapBtn from "./EditMapBtn";

export default function EditMapTab() {
    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto">
            <div className="p-2">
                <button className="p-2 flex w-full text-white bg-[#1E2E33] rounded-lg">
                    < DetectIcon />
                    <label className="mx-auto">Detect Roads</label>
                </button>
            </div>
            <div className="px-2 py-1 flex text-black text-sm bg-[#E5E8EB]">
                Navigation Tools
            </div>
            <div className="p-2 grid grid-cols-6 gap-2">
                <EditMapBtn
                    id="span"
                    icon={<SpanIcon />}
                    onClick={(name) => { }}
                />
                <EditMapBtn
                    id="zoom-out"
                    icon={<ZoomOutIcon />}
                    onClick={(name) => { }}
                />
                <EditMapBtn
                    id="zoom-in"
                    icon={<ZoomInIcon />}
                    onClick={(name) => { }}
                />
            </div>
            <div className="px-2 py-1 flex text-black text-sm bg-[#E5E8EB]">
                Edit Tools
            </div>
            <div className="p-2 grid grid-cols-6 gap-2">
                <EditMapBtn
                    id="select"
                    icon={<SelectIcon />}
                    onClick={(name) => { }}
                />
                <EditMapBtn
                    id="polygon"
                    icon={<PolygonIcon />}
                    onClick={(name) => { }}
                />
                <EditMapBtn
                    id="free-hand"
                    icon={<HandDrawIcon />}
                    onClick={(name) => { }}
                />
                <EditMapBtn
                    id="remvove"
                    icon={<RemoveIcon />}
                    onClick={(name) => { }}
                    bg="bg-[#FFD2D2]"
                />
                <EditMapBtn
                    id="undo"
                    icon={<UndoIcon />}
                    onClick={(name) => { }}
                />
                <EditMapBtn
                    id="redo"
                    icon={<RedoIcon />}
                    onClick={(name) => { }}
                />
                <EditMapBtn
                    id="attribute"
                    icon={<AttributeIcon />}
                    onClick={(name) => { }}
                />
            </div>
            <div className="px-2 py-1 flex text-black text-sm bg-[#E5E8EB]">
                Node Tools
            </div>
            <div className="p-2 grid grid-cols-6 gap-2">
                <EditMapBtn
                    id="add-node"
                    icon={<AddNodeIcon />}
                    onClick={(name) => { }}
                />
                <EditMapBtn
                    id="delete-node"
                    icon={<DeleteNodeIcon />}
                    onClick={(name) => { }}
                    bg="bg-[#FFD2D2]"
                />
                <EditMapBtn
                    id="move-node"
                    icon={<MoveNodeIcon />}
                    onClick={(name) => { }}
                />
                <EditMapBtn
                    id="merge-node"
                    icon={<MergeNodeIcon />}
                    onClick={(name) => { }}
                />
            </div>
            <div className="px-2 py-1 flex text-black text-sm bg-[#E5E8EB]">
                Overshoot/Undershoot
            </div>
            <div className="p-2 flex items-center justify-center">
                <input
                    className="mr-2 p-2 w-full border-1 border-[#7B7B7B] rounded-lg text-black placeholder-[#7B7B7B]"
                    placeholder="Threshold"
                />
                <button className="p-2 flex w-full text-black bg-[#E8F3FF] rounded-lg">
                    < ShootIcon />
                    <label className="ml-2 mr-auto">Remove</label>
                </button>
            </div>
            <div className="sticky bottom-0 mt-auto h-fit p-3 flex items-center justify-center bg-white shadow-[0_0_30px_0_rgba(0,0,0,0.1)] rounded-t-2xl">
                <button className="mr-2 p-2 flex w-full text-black bg-[#E5E8EB] rounded-lg cursor-pointer">
                    < CancelIcon />
                    <label className="ml-2 mr-auto cursor-pointer">Cancel</label>
                </button>
                <button className="p-2 flex w-full text-white bg-[#1E2E33] rounded-lg cursor-pointer">
                    < SaveIcon />
                    <label className="ml-2 mr-auto cursor-pointer">Save</label>
                </button>
            </div>
        </div>
    );
}