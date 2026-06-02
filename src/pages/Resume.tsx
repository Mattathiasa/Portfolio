import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCV } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CV } from '@/data/defaults';
import type { CVData } from '@/types/portfolio';
import { Printer } from 'lucide-react';

export default function Resume() {
  const { data, isLoading } = useQuery({
    queryKey: ['cv'],
    queryFn: getCV,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Auto-trigger print dialog when opened from "Download CV" button
  useEffect(() => {
    const autoPrint = new URLSearchParams(window.location.search).get('print') === '1';
    if (!autoPrint || isLoading) return;
    const t = setTimeout(() => window.print(), 800);
    return () => clearTimeout(t);
  }, [isLoading]);

  const cv: CVData = data ?? DEFAULT_CV;
  const h = cv.header;

  return (
    <>
      {/* Print button — hidden when printing */}
      <button
        onClick={() => window.print()}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-lg hover:bg-blue-700 transition-colors print:hidden"
      >
        <Printer className="w-4 h-4" /> Download PDF
      </button>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        body { background: #f1f5f9; }

        .cv-root {
          font-family: 'Segoe UI', Calibri, Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.5;
          color: #1a1a1a;
          background: #fff;
          max-width: 860px;
          margin: 32px auto;
          padding: 36px 44px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.10);
          border-radius: 4px;
        }

        .cv-header { text-align: center; padding-bottom: 12px; border-bottom: 2.5px solid #2563eb; margin-bottom: 18px; }
        .cv-header h1 { font-size: 24pt; font-weight: 800; letter-spacing: 0.8px; color: #0f172a; }
        .cv-role { font-size: 11pt; font-weight: 600; color: #2563eb; margin: 3px 0 2px; }
        .cv-tagline { font-size: 8.5pt; color: #64748b; }
        .cv-contact { display: flex; justify-content: center; flex-wrap: wrap; gap: 4px 14px; font-size: 8.5pt; color: #475569; margin-top: 8px; }
        .cv-contact a { color: #2563eb; text-decoration: none; }
        .cv-contact a:hover { text-decoration: underline; }
        .sep { color: #cbd5e1; }

        .cv-section { margin-bottom: 16px; }
        .cv-section-title { font-size: 9pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; border-bottom: 1px solid #dbeafe; padding-bottom: 3px; margin-bottom: 8px; margin-top: 4px; }

        .cv-summary { font-size: 9.5pt; color: #334155; line-height: 1.55; }

        .cv-skills-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
        .cv-skills-table td { padding: 2px 6px 2px 0; vertical-align: top; }
        .sk-label { font-weight: 700; color: #0f172a; white-space: nowrap; width: 130px; }
        .sk-value { color: #334155; }

        .cv-entry, .cv-proj { margin-bottom: 10px; page-break-inside: avoid; }
        .cv-entry-top, .cv-proj-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
        .cv-entry-title, .cv-proj-name { font-weight: 700; font-size: 10pt; color: #0f172a; }
        .cv-entry-org { font-size: 9pt; color: #475569; font-style: italic; margin-top: 1px; }
        .cv-entry-date { font-size: 8.5pt; color: #475569; white-space: nowrap; text-align: right; }
        .cv-badge { font-size: 7.5pt; font-weight: 700; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 3px; padding: 1px 5px; white-space: nowrap; }
        .cv-entry ul, .cv-proj-bullets { margin: 5px 0 0 16px; list-style: disc; }
        .cv-entry ul li, .cv-proj-bullets li { font-size: 9.5pt; color: #334155; margin-bottom: 3px; }

        .cv-proj-link { font-size: 8.5pt; color: #2563eb; text-decoration: none; }
        .cv-proj-link:hover { text-decoration: underline; }
        .cv-proj-tech { font-size: 8.5pt; color: #64748b; font-style: italic; margin: 2px 0; }

        .cv-lang { font-size: 9.5pt; color: #334155; }

        @media print {
          body { background: #fff; }
          .cv-root { margin: 0; padding: 18px 28px; box-shadow: none; border-radius: 0; }
          @page { margin: 0.4in; }
        }
      `}</style>

      <div className="cv-root">
        {/* Header */}
        <div className="cv-header">
          <h1>{h.name}</h1>
          <div className="cv-role">{h.role}</div>
          {h.tagline1 && <div className="cv-tagline">{h.tagline1}</div>}
          {h.tagline2 && <div className="cv-tagline">{h.tagline2}</div>}
          <div className="cv-contact">
            {h.email    && <a href={`mailto:${h.email}`}>{h.email}</a>}
            {h.phone    && <><span className="sep">|</span><a href={`tel:${h.phone}`}>{h.phone}</a></>}
            {h.location && <><span className="sep">|</span><span>{h.location}</span></>}
            {h.linkedin && <><span className="sep">|</span><a href={h.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></>}
            {h.portfolio && <><span className="sep">|</span><a href={h.portfolio} target="_blank" rel="noopener noreferrer">Portfolio</a></>}
            {h.github   && <><span className="sep">|</span><a href={h.github} target="_blank" rel="noopener noreferrer">GitHub</a></>}
          </div>
        </div>

        {/* Summary */}
        {cv.summary && (
          <div className="cv-section">
            <div className="cv-section-title">Summary</div>
            <p className="cv-summary">{cv.summary}</p>
          </div>
        )}

        {/* Skills */}
        {cv.skills.length > 0 && (
          <div className="cv-section">
            <div className="cv-section-title">Skills</div>
            <table className="cv-skills-table">
              <tbody>
                {cv.skills.map((s, i) => (
                  <tr key={i}>
                    <td className="sk-label">{s.label}</td>
                    <td className="sk-value">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Experience */}
        {cv.experience.length > 0 && (
          <div className="cv-section">
            <div className="cv-section-title">Work Experience</div>
            {cv.experience.map(exp => (
              <div key={exp.id} className="cv-entry">
                <div className="cv-entry-top">
                  <div>
                    <div className="cv-entry-title">
                      {exp.title}&nbsp;<span className="cv-badge">{exp.badge}</span>
                    </div>
                    <div className="cv-entry-org">{exp.org}</div>
                  </div>
                  <div className="cv-entry-date">{exp.date}</div>
                </div>
                <ul>
                  {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {cv.projects.length > 0 && (
          <div className="cv-section">
            <div className="cv-section-title">Projects</div>
            {cv.projects.map(proj => (
              <div key={proj.id} className="cv-proj">
                <div className="cv-proj-top">
                  <span className="cv-proj-name">{proj.name}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {proj.liveUrl   && <a className="cv-proj-link" href={proj.liveUrl} target="_blank" rel="noopener noreferrer">Live</a>}
                    {proj.liveUrl && proj.githubUrl && <span className="sep">|</span>}
                    {proj.githubUrl && <a className="cv-proj-link" href={proj.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>}
                  </div>
                </div>
                {proj.tech && <div className="cv-proj-tech">{proj.tech}</div>}
                <ul className="cv-proj-bullets">
                  {proj.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {cv.education.length > 0 && (
          <div className="cv-section">
            <div className="cv-section-title">Education</div>
            {cv.education.map(edu => (
              <div key={edu.id} className="cv-entry">
                <div className="cv-entry-top">
                  <div>
                    <div className="cv-entry-title">{edu.degree}</div>
                    <div className="cv-entry-org">{edu.school}</div>
                  </div>
                  <div className="cv-entry-date">
                    {edu.date}
                    {edu.gpa && <><br /><span style={{ color: '#2563eb', fontWeight: 700 }}>GPA: {edu.gpa}</span></>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Languages */}
        {cv.languages.length > 0 && (
          <div className="cv-section">
            <div className="cv-section-title">Languages</div>
            <div className="cv-lang">
              {cv.languages.map((l, i) => (
                <span key={i}>
                  <strong>{l.name}</strong> — {l.level}
                  {i < cv.languages.length - 1 && <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
