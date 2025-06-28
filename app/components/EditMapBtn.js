export default function EditMapBtn({ id, icon, onClick, bg="bg-[#E5E8EB]" }) {
    return (
        <button
            id={id}
            onClick={() => onClick(id)}
            className={`p-2 flex ${bg} items-center justify-center rounded-lg cursor-pointer hover:scale-105`}
        >
            {icon}
        </button>
    );
}
