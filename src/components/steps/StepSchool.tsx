import React from 'react';
import { School, Language } from '../../types';
import { 
  MapPin, 
  School as SchoolIcon, 
  Calendar, 
  Clock, 
  Coffee, 
  Utensils, 
  Layers 
} from 'lucide-react';

interface StepSchoolProps {
  school: School;
  updateSchool: (updates: Partial<School>) => void;
  lang: Language;
}

const StepSchool: React.FC<StepSchoolProps> = ({ school, updateSchool, lang }) => {
  const isEn = lang === 'en';

  const lbl = (textEn: string, textSw: string) => (
    <label className="block text-sm font-medium mb-1 text-gray-700">
      {isEn ? textEn : textSw}
    </label>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* SECTION 1: BASIC INFO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
          <SchoolIcon size={24} />
          {isEn ? 'School Information' : 'Habari za Shule'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* School Name */}
          <div className="col-span-full">
            {lbl('School Name', 'Jina la Shule')}
            <div className="relative">
              <input
                type="text"
                className="input-field pl-10"
                placeholder={isEn ? "e.g. Hilltop Academy" : "mfano Shule ya Msingi Hilltop"}
                value={school.name}
                onChange={(e) => updateSchool({ name: e.target.value })}
              />
              <SchoolIcon className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* County */}
          <div>
            {lbl('County', 'Kaunti')}
            <div className="relative">
              <input
                type="text"
                className="input-field pl-10"
                placeholder={isEn ? "e.g. Nairobi" : "mfano Nairobi"}
                value={school.county}
                onChange={(e) => updateSchool({ county: e.target.value })}
              />
              <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* Term */}
          <div>
            {lbl('Term / Year', 'Muhula / Mwaka')}
            <div className="relative">
              <input
                type="text"
                className="input-field pl-10"
                placeholder={isEn ? "e.g. Term 1, 2024" : "mfano Muhula wa 1, 2024"}
                value={school.term}
                onChange={(e) => updateSchool({ term: e.target.value })}
              />
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* School Level Selector */}
          <div>
            {lbl('School Level', 'Kiwango cha Shule')}
            <div className="relative">
              <select
                className="input-field pl-10"
                value={school.level}
                onChange={(e) => updateSchool({ level: e.target.value as any })}
              >
                <option value="primary">Primary School</option>
                <option value="jss">Junior Secondary (JSS)</option>
                <option value="both">Both Primary & JSS</option>
              </select>
              <Layers className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* Start Time */}
          <div>
            {lbl('School Start Time', 'Muda wa Kuanza Masomo')}
            <div className="relative">
              <input
                type="time"
                className="input-field pl-10"
                value={school.startTime || "08:20"}
                onChange={(e) => updateSchool({ startTime: e.target.value })}
              />
              <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: LESSON & BREAK SCHEDULING */}
      <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-700">
          <Clock size={24} />
          {isEn ? 'Time & Duration Settings' : 'Mipangilio ya Muda'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lesson Duration */}
          <div>
            {lbl('Lesson Duration (Mins)', 'Muda wa Somo (Dakika)')}
            <div className="relative">
              <input
                type="number"
                className="input-field pl-10"
                min="20"
                max="60"
                value={school.lessonDuration || 40}
                onChange={(e) => updateSchool({ lessonDuration: parseInt(e.target.value) || 40 })}
              />
              <Clock className="absolute left-3 top-2.5 text-blue-400" size={18} />
            </div>
          </div>

          {/* Break Duration */}
          <div>
            {lbl('Break Duration (Mins)', 'Muda wa Mapumziko')}
            <div className="relative">
              <input
                type="number"
                className="input-field pl-10"
                min="5"
                max="60"
                value={school.breakDuration || 20}
                onChange={(e) => updateSchool({ breakDuration: parseInt(e.target.value) || 20 })}
              />
              <Coffee className="absolute left-3 top-2.5 text-orange-400" size={18} />
            </div>
          </div>

          {/* Lunch Duration */}
          <div>
            {lbl('Lunch Duration (Mins)', 'Muda wa Chakula cha Mchana')}
            <div className="relative">
              <input
                type="number"
                className="input-field pl-10"
                min="20"
                max="90"
                value={school.lunchDuration || 40}
                onChange={(e) => updateSchool({ lunchDuration: parseInt(e.target.value) || 40 })}
              />
              <Utensils className="absolute left-3 top-2.5 text-green-500" size={18} />
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white/50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-800 leading-relaxed">
            {isEn 
              ? "Note: Changing these values will update the timestamps on the final timetable PDF and view. Most schools use 40 mins for lessons and 20 mins for breaks." 
              : "Kumbuka: Kubadilisha muda huu kutasasisha nyakati kwenye ratiba yako. Shule nyingi hutumia dakika 40 kwa vipindi na 20 kwa mapumziko."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepSchool;