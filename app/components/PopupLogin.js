'use client'

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PopupLogin({ onClose, onLogin }) {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState("");
    const districts = ["Select", "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"];
    const taluks = ["Select", "Thiruvananthapuram", "Nedumangadu", "Chirayinkeezhu", "Kattakada", "Neyyattinkara", "Varkala"];
    const villages = ["Select", "Andoorkonam", "Attipra", "Cheruvakkal", "Iroopara(Ayiroopara)", "Kadakampally", "Kadinamkulam", "Kalliyoor", "Kazhakoottam", "Keezhthonnakkal", "Kudappanakunnu"];

    const handleLogin = async (e) => {
        e.preventDefault();
        const res = await fetch("/api/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
            headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
            router.push("/edit_map");
        } else {
            const data = await res.json();
            setError(data.error);
        }
    };

    return (
        <div className="absolute z-10 h-screen w-screen flex items-center justify-center bg-[#00000030]">
            <div className="flex flex-col items-center juustify-center h-fit w-fit bg-white rounded-lg p-3">
                <form onSubmit={handleLogin}>
                    <div className="flex justify-center">
                        <div className="flex flex-col mr-3 text-black">
                            <label className="text-black text-base">Select an area of interest</label>
                            <select className="mt-2 p-2 w-48 border-1 border-[#7B7B7B] rounded-lg">
                                {districts.map((option, index) => {
                                    return <option key={index} value={option}>{option}</option>
                                })}
                            </select>
                            <select className="mt-2 p-2 w-48 border-1 border-[#7B7B7B] rounded-lg">
                                {taluks.map((option, index) => {
                                    return <option key={index} value={option}>{option}</option>
                                })}
                            </select>
                            <select className="mt-2 p-2 w-48 border-1 border-[#7B7B7B] rounded-lg">
                                {villages.map((option, index) => {
                                    return <option key={index} value={option}>{option}</option>
                                })}
                            </select>
                        </div>
                        <div className="w-[1px] bg-[#E5E8EB]" />
                        <div className="flex flex-col ml-3">
                            <label className="text-black text-base">Enter Log In Credentials</label>
                            <input
                                value={username}
                                onChange={(e) => { setUsername(e.target.value) }}
                                className="mt-2 p-2 w-48 border-1 border-[#7B7B7B] text-black placeholder-[#7B7B7B] rounded-lg"
                                placeholder="Username"
                            />
                            <input
                                value={password}
                                onChange={(e) => { setPassword(e.target.value) }}
                                className="mt-2 p-2 w-48 border-1 border-[#7B7B7B] text-black placeholder-[#7B7B7B] rounded-lg"
                                placeholder="Password"
                            />
                            {error && <p className="test-xs text-red-500">{error}</p>}
                        </div>
                    </div>
                    <div className="flex w-full items-center justify-center gap-3 pt-3">
                        <button onClick={onClose} className="py-2 flex flex-1 text-black text-sm bg-[#F0F2F5] rounded-lg items-center justify-center cursor-pointer hover:scale-105 transition">
                            <label>Cancel</label>
                        </button>
                        <button onClick={onLogin} type="submit" className="py-2 flex flex-1 text-white text-sm bg-[#1E2E33] rounded-lg items-center justify-center cursor-pointer hover:scale-105 transition">
                            <label>Login</label>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}