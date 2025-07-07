import { AvatarIcon } from "./Icons";

export default function LogCard({timestamp, name, desc, onClick}) {
    return (
        <div className="mx-2 mt-4 p-2 bg-white shadow-lg drop-shadow rounded-lg h-fit">
            <div>
                <label className="text-black text-sm font-bold">{new Date(timestamp).toLocaleString()}</label>
                <div className="my-1 flex items-center">
                    <div className="mr-2 p-1 bg-[#F5F5F5] rounded-full">
                        < AvatarIcon />
                    </div>
                    <label className="text-black text-sm">{name}</label>
                </div>
                <label className="text-black text-sm">{desc}</label>
                <div onClick={onClick} className="flex items-center justify-end">
                    <button className="text-[#1A3FE5] text-xs font-bold">Show in map</button>
                </div>
            </div>
        </div>
    );
}