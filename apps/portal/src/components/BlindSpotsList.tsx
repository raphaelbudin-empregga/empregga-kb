'use client';

import React, { useEffect, useState } from 'react';

interface BlindSpot {
    id: string;
    query: string;
    resolved: boolean;
    createdAt: string;
}

export default function BlindSpotsList() {
    const [spots, setSpots] = useState<BlindSpot[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSpots = async () => {
        try {
            const response = await fetch('/api/blindspots');
            const result = await response.json();
            if (result.success) {
                setSpots(result.data);
            }
        } catch (error) {
            console.error('Error fetching blind spots:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpots();
        const interval = setInterval(fetchSpots, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return null; // ou um esqueleto / loader discreto
    }

    if (spots.length === 0) {
        return null;
    }

    return (
        <div className="bg-red-50/50 rounded-2xl shadow-sm border border-red-500/20 overflow-hidden mb-8">
            <div className="p-4 border-b border-red-500/10 bg-red-500/5 flex justify-between items-center">
                <h3 className="font-title text-sm uppercase tracking-widest text-red-700 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Blind Spots Recentes
                </h3>
            </div>
            <div className="p-4">
                <ul className="space-y-3">
                    {spots.map((spot) => (
                        <li key={spot.id} className="text-sm bg-white p-3 rounded shadow-sm border border-red-100 flex justify-between items-start gap-4">
                            <span className="text-foreground/80 flex-1 leading-relaxed">"{spot.query}"</span>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">
                                    Não Respondido
                                </span>
                                <span className="text-[10px] opacity-50">
                                    {new Date(spot.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
