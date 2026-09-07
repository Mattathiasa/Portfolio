import { useQuery } from '@tanstack/react-query';
import { getCertifications } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CERTIFICATIONS } from '@/data/defaults';

/**
 * Credentials row rendered inside the #skills section — no section wrapper.
 * Data still comes from content/certifications (editable in Admin → Certs).
 */
export const Certifications = () => {
  const { data: firestoreCerts } = useQuery({
    queryKey: ['certifications'],
    queryFn: getCertifications,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const certs =
    firestoreCerts && firestoreCerts.length > 0
      ? [...firestoreCerts].sort((a, b) => a.order - b.order)
      : DEFAULT_CERTIFICATIONS;

  if (!certs.length) return null;

  return (
    <ul data-reveal className="mt-14 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {certs.map((cert, index) => {
        const body = (
          <>
            <p className="mono-label mb-2 !text-accent">{cert.date}</p>
            <p className="text-[15px] font-medium text-foreground">{cert.name}</p>
            <p className="mt-1 text-[13px] text-foreground/55">{cert.issuer}</p>
          </>
        );
        return (
          <li key={cert.id ?? index} className="border-t hairline pt-4">
            {cert.url ? (
              <a href={cert.url} target="_blank" rel="noopener noreferrer" className="group block">
                {body}
              </a>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
};
