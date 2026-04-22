"use client";

import { useState } from "react";
import { Clock, Plus, Trash2, Calendar, AlertCircle } from "lucide-react";

interface ScheduleEntry {
  day: string;
  opening_time?: string;
  closing_time?: string;
  is_closed: boolean;
}

interface ScheduleEditorProps {
  schedules: ScheduleEntry[];
  onChange: (schedules: ScheduleEntry[]) => void;
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function ScheduleEditor({ schedules, onChange }: ScheduleEditorProps) {
  const addDay = () => {
    onChange([...schedules, { day: "Lunes", opening_time: "09:00", closing_time: "18:00", is_closed: false }]);
  };

  const updateEntry = (index: number, data: Partial<ScheduleEntry>) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], ...data };
    onChange(newSchedules);
  };

  const removeEntry = (index: number) => {
    onChange(schedules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Horarios de Apertura
        </h3>
        <button 
          onClick={addDay}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 text-sm font-bold rounded-xl hover:bg-blue-600/30 transition-colors border border-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Añadir Turno
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl text-center">
          <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No hay horarios. Haz clic en añadir para empezar.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-slate-800/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
            <div>Día</div>
            <div>Apertura</div>
            <div>Cierre</div>
            <div className="text-right pr-2">Acciones</div>
          </div>

          {schedules.map((entry, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 p-4 md:py-2.5 items-center group hover:bg-white/[0.02] transition-colors">
              <div>
                <select 
                  value={entry.day}
                  onChange={(e) => updateEntry(idx, { day: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-white/5 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all hover:bg-slate-800"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              
              {!entry.is_closed ? (
                <>
                  <div>
                    <input 
                      type="time" 
                      value={entry.opening_time || ""} 
                      onChange={(e) => updateEntry(idx, { opening_time: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/80 border border-white/5 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all hover:bg-slate-800"
                    />
                  </div>
                  <div>
                    <input 
                      type="time" 
                      value={entry.closing_time || ""} 
                      onChange={(e) => updateEntry(idx, { closing_time: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/80 border border-white/5 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all hover:bg-slate-800"
                    />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2 py-2 px-3 bg-red-500/10 border border-red-500/10 rounded-xl text-red-400 text-sm italic font-medium flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Cerrado todo el día
                </div>
              )}

              <div className="flex items-center gap-2 justify-end">
                <button 
                  onClick={() => updateEntry(idx, { is_closed: !entry.is_closed })}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${entry.is_closed ? 'bg-green-600/20 text-green-400 border border-green-500/20' : 'bg-slate-700/50 text-slate-400 border border-white/5 hover:bg-slate-700 hover:text-white'}`}
                >
                  {entry.is_closed ? 'Abrir' : 'Cerrar'}
                </button>
                <button 
                  onClick={() => removeEntry(idx)}
                  className="p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors"
                  title="Eliminar turno"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
