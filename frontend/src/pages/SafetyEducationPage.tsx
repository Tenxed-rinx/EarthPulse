import React, { useState } from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  AlertTriangle, 
  ExternalLink,
  Flame,
  Home,
  Waves,
  Building2,
  Radio,
  BookOpen
} from 'lucide-react';

export const SafetyEducationPage: React.FC = () => {
  const [activeSafetyTab, setActiveSafetyTab] = useState<'during' | 'before' | 'after'>('during');

  const historicalArticles = [
    {
      id: 'sumatra-2004',
      title: 'The 2004 Boxing Day Megathrust & Tsunami: What Scientists Learned',
      magnitude: 'M 9.1',
      date: 'December 26, 2004',
      region: 'Sunda Megathrust (Sumatra, Indonesia)',
      readTime: '6 min read',
      summary: 'The third-largest earthquake recorded in modern history ruptured over 1,300 km of the Indo-Australian plate boundary. The disaster led to the creation of the Indian Ocean Tsunami Warning and Mitigation System (IOTWMS).',
      lessons: [
        'Megathrust subduction earthquakes can generate tsunamis capable of crossing entire oceans in hours.',
        'Deep-ocean DART (Deep-ocean Assessment and Reporting of Tsunamis) buoys are crucial for real-time wave amplitude detection.'
      ],
      link: 'https://earthquake.usgs.gov/earthquakes/eventpage/official20041226005853450_30/executive'
    },
    {
      id: 'tohoku-2011',
      title: 'Tohoku 2011: Engineering Resiliency and Nuclear Safety Overhaul',
      magnitude: 'M 9.1',
      date: 'March 11, 2011',
      region: 'Japan Trench (Honshu, Japan)',
      readTime: '8 min read',
      summary: 'Japan’s early warning system delivered a 1-minute alert to Tokyo before seismic S-waves arrived, automatically stopping bullet trains. However, a 40-meter tsunami overtopped sea walls, prompting global revisions to critical infrastructure codes.',
      lessons: [
        'Automated P-wave detection algorithms save thousands of lives by shutting off gas mains and stopping high-speed trains.',
        'Seawalls must be modeled against 1,000-year recurrence intervals rather than standard 100-year baselines.'
      ],
      link: 'https://earthquake.usgs.gov/earthquakes/eventpage/official20110311054624120_30/executive'
    },
    {
      id: 'maule-2010',
      title: 'Chile 2010: How Strict Seismic Building Codes Saved Countless Lives',
      magnitude: 'M 8.8',
      date: 'February 27, 2010',
      region: 'Nazca-South American Plate Boundary (Maule, Chile)',
      readTime: '5 min read',
      summary: 'Despite being one of the strongest earthquakes ever recorded, Chile’s strict adherence to ductile reinforced concrete engineering ensured that over 90% of high-rise structures in Santiago suffered no structural failure.',
      lessons: [
        'Enforcing modern anti-seismic building codes is the single most effective tool to mitigate earthquake casualties.',
        'Base-isolation bearings decouple buildings from ground accelerations, absorbing shear strain.'
      ],
      link: 'https://earthquake.usgs.gov/earthquakes/eventpage/official20100227063411530_30/executive'
    },
    {
      id: 'turkey-syria-2023',
      title: 'The 2023 East Anatolian Fault Strike-Slip Doublet',
      magnitude: 'M 7.8 & M 7.5',
      date: 'February 6, 2023',
      region: 'East Anatolian Fault Zone (Turkey / Syria)',
      readTime: '7 min read',
      summary: 'Two catastrophic shallow strike-slip earthquakes struck within 9 hours along adjacent fault segments. The tragedy highlighted the risks of soft-story collapse, non-ductile concrete, and fault stress triggering.',
      lessons: [
        'Shallow focus events (<15 km depth) direct near-total kinetic energy into surface structures without mantle attenuation.',
        'Retrofitting soft-story buildings with steel bracing prevents pancake structural collapses.'
      ],
      link: 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000jllz/executive'
    }
  ];

  const emergencyContacts = [
    { country: 'United States', agency: 'FEMA / USGS National Earthquake Information Center', number: '1-800-621-3362', site: 'fema.gov' },
    { country: 'Japan', agency: 'JMA (Japan Meteorological Agency) Disaster Hotline', number: '119 / 110', site: 'jma.go.jp' },
    { country: 'India', agency: 'NDRF (National Disaster Response Force) Helpline', number: '1078 / 011-24363260', site: 'ndrf.gov.in' },
    { country: 'Global / UN', agency: 'UN-SPIDER & International Red Cross Relief', number: '112 / 911 (Local Emergency)', site: 'un-spider.org' }
  ];

  return (
    <div className="space-y-8">
      {/* 1. Life-Saving Action Guide (Drop, Cover, Hold On) */}
      <div className="bg-[#0d1626] border border-[#142338] rounded-xl p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#142338]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">Earthquake Preparedness & Action Protocol</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Verified survival procedures recommended by the USGS, FEMA, and International Red Cross</p>
          </div>

          {/* Action Stage Tabs */}
          <div className="flex items-center bg-[#070c14] p-1 rounded-lg border border-[#192b45] text-xs font-mono">
            <button
              onClick={() => setActiveSafetyTab('during')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeSafetyTab === 'during' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              During Shaking
            </button>
            <button
              onClick={() => setActiveSafetyTab('before')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeSafetyTab === 'before' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Before (Preparedness)
            </button>
            <button
              onClick={() => setActiveSafetyTab('after')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeSafetyTab === 'after' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              After (Evacuation)
            </button>
          </div>
        </div>

        {/* Dynamic Tab Content */}
        {activeSafetyTab === 'during' && (
          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#080e1a] border border-[#192b45] rounded-xl p-5 hover:border-teal-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-lg mb-3">
                1
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                <span>DROP to Hands and Knees</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Drop down immediately before the violent ground acceleration throws you down. This low position protects you from being knocked off balance and allows you to move if needed.
              </p>
            </div>

            <div className="bg-[#080e1a] border border-[#192b45] rounded-xl p-5 hover:border-teal-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-lg mb-3">
                2
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                <span>COVER Head and Torso</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Take shelter underneath a sturdy desk or table. If no shelter is nearby, drop down against an interior wall away from windows, heavy mirrors, and overhead lighting fixtures.
              </p>
            </div>

            <div className="bg-[#080e1a] border border-[#192b45] rounded-xl p-5 hover:border-teal-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-lg mb-3">
                3
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                <span>HOLD ON until Shaking Stops</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hold on to your shelter with one hand and protect your neck with the other. Be prepared for your shelter to shift across the floor as ground motion ripples through the structure.
              </p>
            </div>
          </div>
        )}

        {activeSafetyTab === 'before' && (
          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#080e1a] border border-[#192b45] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Home className="w-4 h-4 text-teal-400" />
                <span>Secure Heavy Home Objects</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Anchor book cases, water heaters, refrigerators, and heavy mirrors directly into wall studs with flexible nylon straps. Install latches on kitchen cupboards to stop glassware from flying out.
              </p>
            </div>

            <div className="bg-[#080e1a] border border-[#192b45] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Radio className="w-4 h-4 text-teal-400" />
                <span>72-Hour Emergency Go-Bag</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pack 3 liters of water per person per day, non-perishable canned food, manual can opener, N95 dust masks, crank-powered radio, first aid supplies, flashlights, and portable power banks.
              </p>
            </div>

            <div className="bg-[#080e1a] border border-[#192b45] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-400" />
                <span>Family Evacuation & Comms Plan</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Designate an out-of-town contact person. Text messages often get through when cellular voice networks are congested. Identify a safe outdoor open space away from power lines.
              </p>
            </div>
          </div>
        )}

        {activeSafetyTab === 'after' && (
          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#080e1a] border border-[#192b45] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Check for Gas Leaks & Fire</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you smell gas or hear a hissing noise, shut off the main gas valve immediately and open windows. Do NOT flip electrical switches, strike matches, or use open flames—sparks cause secondary explosions.
              </p>
            </div>

            <div className="bg-[#080e1a] border border-[#192b45] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Waves className="w-4 h-4 text-cyan-400" />
                <span>Coastal Tsunami Evacuation</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you are near the coast and feel shaking that lasts longer than 20 seconds or notice water receding rapidly, do NOT wait for sirens. Evacuate inland and to higher ground (at least 30 meters above sea level) immediately on foot.
              </p>
            </div>

            <div className="bg-[#080e1a] border border-[#192b45] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Expect Violent Aftershocks</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Large earthquakes trigger hundreds of aftershocks over hours, days, and months. Buildings weakened by the primary shock can collapse during aftershocks. Only re-enter inspected structures.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Educational Case Studies & In-Depth Historical Articles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>Historical Megaquakes: Scientific Lessons & Case Studies</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Deep-dive research into how historical ruptures revolutionized seismology and building codes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {historicalArticles.map((article) => (
            <div key={article.id} className="bg-[#0d1626] border border-[#142338] rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-teal-400 font-bold">{article.magnitude}</span>
                  <span className="text-slate-400">{article.date} &bull; {article.readTime}</span>
                </div>

                <h3 className="text-base font-bold text-white mb-2 hover:text-teal-300 transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium mb-3">{article.region}</p>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{article.summary}</p>

                <div className="bg-[#080e1a] border border-[#192b45] rounded-lg p-3.5 space-y-2 mb-4">
                  <div className="text-[11px] font-mono text-teal-300 font-semibold uppercase tracking-wider">Key Seismological Lessons:</div>
                  {article.lessons.map((lesson, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-teal-400 mt-0.5">&bull;</span>
                      <span>{lesson}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#142338] flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Source: USGS ComCat</span>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-teal-400 hover:text-teal-300 flex items-center gap-1.5"
                >
                  <span>Official USGS Event Report</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Global Emergency Relief & Response Contacts */}
      <div className="bg-[#0d1626] border border-[#142338] rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-slate-100">Official Disaster Response & Relief Directory</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Emergency Hotlines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {emergencyContacts.map((c, i) => (
            <div key={i} className="bg-[#080e1a] border border-[#192b45] rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs text-slate-400 font-sans font-semibold">{c.country}</div>
                <div className="text-xs text-white font-bold my-1">{c.agency}</div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#142338]">
                <div className="text-xs text-teal-400 font-bold">{c.number}</div>
                <div className="text-[11px] text-slate-400">{c.site}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
