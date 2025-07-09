import { LockOpen } from "./Icons";

export default function LockedRoadTile({ roadid, state, onClick }) {
    return (
        <tr className="odd:bg-[#F6F6F6] even:bg-[#E5E8EB]">
            <td className="text-left px-2 py-2">{roadid}</td>
            <td className="place-items-center px-2 py-2">
                <div className={`w-2 h-2 rounded-full border-[1px] border-white ${state == 'c'?"bg-yellow-300":"bg-green-500"}`}></div>
            </td>
            <td className="place-items-center px-2 py-2">
                <button onClick={() => onClick(roadid)} className="flex place-items-center cursor-pointer hover:scale-105">< LockOpen/></button>
            </td>
        </tr>
    );
}