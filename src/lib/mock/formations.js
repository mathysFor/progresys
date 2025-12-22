// Mock data for formations
// Structure: formation → modules → chapitres → (sous-chapitres) → cours → contenus

export const formations = [
  {
    id: "iobsp",
    name: "IOBSP - Formation Longue",
    type: "longue",
    modules: [
      {
        id: "module-1",
        name: "Module 1: Fondamentaux",
        chapters: [
          {
            id: "chapter-1-1",
            name: "Chapitre 1: Introduction",
            subChapters: [
              {
                id: "subchapter-1-1-1",
                name: "Sous-chapitre 1.1: Notions de base",
                courses: [
                  {
                    id: "course-1-1-1-1",
                    name: "Cours 1.1.1: Introduction générale",
                    durationSeconds: 1800, // 30 minutes
                    contents: [
                      {
                        id: "content-1",
                        type: "video",
                        url: "https://example.com/video-1-1-1-1.mp4",
                        title: "Vidéo d'introduction",
                      },
                      {
                        id: "content-2",
                        type: "pdf",
                        url: "https://example.com/pdf-1-1-1-1.pdf",
                        title: "Support de cours",
                      },
                    ],
                  },
                  {
                    id: "course-1-1-1-2",
                    name: "Cours 1.1.2: Concepts clés",
                    durationSeconds: 2400, // 40 minutes
                    contents: [
                      {
                        id: "content-3",
                        type: "video",
                        url: "https://example.com/video-1-1-1-2.mp4",
                        title: "Vidéo concepts",
                      },
                      {
                        id: "content-4",
                        type: "canva",
                        url: "https://example.com/canva-1-1-1-2",
                        title: "Présentation Canva",
                      },
                    ],
                  },
                ],
              },
              {
                id: "subchapter-1-1-2",
                name: "Sous-chapitre 1.2: Approfondissement",
                courses: [
                  {
                    id: "course-1-1-2-1",
                    name: "Cours 1.1.2.1: Approfondissement",
                    durationSeconds: 2100, // 35 minutes
                    contents: [
                      {
                        id: "content-5",
                        type: "video",
                        url: "https://example.com/video-1-1-2-1.mp4",
                        title: "Vidéo approfondissement",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "chapter-1-2",
            name: "Chapitre 2: Techniques avancées",
            subChapters: [
              {
                id: "subchapter-1-2-1",
                name: "Sous-chapitre 2.1: Techniques",
                courses: [
                  {
                    id: "course-1-2-1-1",
                    name: "Cours 1.2.1.1: Techniques avancées",
                    durationSeconds: 3000, // 50 minutes
                    contents: [
                      {
                        id: "content-6",
                        type: "video",
                        url: "https://example.com/video-1-2-1-1.mp4",
                        title: "Vidéo techniques",
                      },
                      {
                        id: "content-7",
                        type: "pdf",
                        url: "https://example.com/pdf-1-2-1-1.pdf",
                        title: "Guide techniques",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "module-tc",
        name: "Tronc Commun",
        chapters: [
          {
            id: "chapter-tc-1",
            name: "Chapitre TC 1: Base commune",
            subChapters: [
              {
                id: "subchapter-tc-1-1",
                name: "Sous-chapitre TC 1.1",
                courses: [
                  {
                    id: "course-tc-1-1-1",
                    name: "Cours TC 1.1.1",
                    durationSeconds: 1500, // 25 minutes
                    contents: [
                      {
                        id: "content-tc-1",
                        type: "video",
                        url: "https://example.com/video-tc-1.mp4",
                        title: "Vidéo TC",
                      },
                    ],
                  },
                  {
                    id: "course-tc-1-1-2",
                    name: "Cours TC 1.1.2",
                    durationSeconds: 1800, // 30 minutes
                    contents: [
                      {
                        id: "content-tc-2",
                        type: "video",
                        url: "https://example.com/video-tc-2.mp4",
                        title: "Vidéo TC 2",
                      },
                      {
                        id: "content-tc-3",
                        type: "pdf",
                        url: "https://example.com/pdf-tc-1.pdf",
                        title: "PDF TC",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ias",
    name: "IAS - Formation Longue",
    type: "longue",
    modules: [
      {
        id: "module-ias-1",
        name: "Module 1: Fondamentaux",
        chapters: [
          {
            id: "chapter-ias-1-1",
            name: "Chapitre 1: Introduction",
            subChapters: [
              {
                id: "subchapter-ias-1-1-1",
                name: "Sous-chapitre 1.1: Notions de base",
                courses: [
                  {
                    id: "course-ias-1-1-1-1",
                    name: "Cours 1.1.1: Introduction générale",
                    durationSeconds: 1800, // 30 minutes
                    contents: [
                      {
                        id: "content-ias-1",
                        type: "video",
                        url: "https://example.com/video-ias-1-1-1-1.mp4",
                        title: "Vidéo d'introduction",
                      },
                      {
                        id: "content-ias-2",
                        type: "pdf",
                        url: "https://example.com/pdf-ias-1-1-1-1.pdf",
                        title: "Support de cours",
                      },
                    ],
                  },
                  {
                    id: "course-ias-1-1-1-2",
                    name: "Cours 1.1.2: Concepts clés",
                    durationSeconds: 2400, // 40 minutes
                    contents: [
                      {
                        id: "content-ias-3",
                        type: "video",
                        url: "https://example.com/video-ias-1-1-1-2.mp4",
                        title: "Vidéo concepts",
                      },
                      {
                        id: "content-ias-4",
                        type: "canva",
                        url: "https://example.com/canva-ias-1-1-1-2",
                        title: "Présentation Canva",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "module-ias-tc",
        name: "Tronc Commun",
        chapters: [
          {
            id: "chapter-ias-tc-1",
            name: "Chapitre TC 1: Base commune",
            subChapters: [
              {
                id: "subchapter-ias-tc-1-1",
                name: "Sous-chapitre TC 1.1",
                courses: [
                  {
                    id: "course-ias-tc-1-1-1",
                    name: "Cours TC 1.1.1",
                    durationSeconds: 1500, // 25 minutes
                    contents: [
                      {
                        id: "content-ias-tc-1",
                        type: "video",
                        url: "https://example.com/video-ias-tc-1.mp4",
                        title: "Vidéo TC",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "dda",
    name: "DDA - Formation Courte",
    type: "courte",
    modules: [
      {
        id: "module-dda-1",
        name: "Module 1: Bases",
        chapters: [
          {
            id: "chapter-dda-1-1",
            name: "Chapitre 1: Introduction",
            courses: [
              {
                id: "course-dda-1-1-1",
                name: "Cours DDA 1.1.1: Introduction",
                durationSeconds: 1200, // 20 minutes
                contents: [
                  {
                    id: "content-dda-1",
                    type: "video",
                    url: "https://example.com/video-dda-1.mp4",
                    title: "Vidéo introduction DDA",
                  },
                  {
                    id: "content-dda-2",
                    type: "pdf",
                    url: "https://example.com/pdf-dda-1.pdf",
                    title: "Support DDA",
                  },
                ],
              },
              {
                id: "course-dda-1-1-2",
                name: "Cours DDA 1.1.2: Pratique",
                durationSeconds: 1500, // 25 minutes
                contents: [
                  {
                    id: "content-dda-3",
                    type: "video",
                    url: "https://example.com/video-dda-2.mp4",
                    title: "Vidéo pratique",
                  },
                  {
                    id: "content-dda-4",
                    type: "canva",
                    url: "https://example.com/canva-dda-1",
                    title: "Canva DDA",
                  },
                ],
              },
            ],
          },
          {
            id: "chapter-dda-1-2",
            name: "Chapitre 2: Applications",
            courses: [
              {
                id: "course-dda-1-2-1",
                name: "Cours DDA 1.2.1: Applications",
                durationSeconds: 1800, // 30 minutes
                contents: [
                  {
                    id: "content-dda-5",
                    type: "video",
                    url: "https://example.com/video-dda-3.mp4",
                    title: "Vidéo applications",
                  },
                  {
                    id: "content-dda-6",
                    type: "pdf",
                    url: "https://example.com/pdf-dda-2.pdf",
                    title: "Guide applications",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "module-dda-tc",
        name: "Tronc Commun",
        chapters: [
          {
            id: "chapter-dda-tc-1",
            name: "Chapitre TC: Base commune",
            courses: [
              {
                id: "course-dda-tc-1-1",
                name: "Cours TC DDA",
                durationSeconds: 2100, // 35 minutes
                contents: [
                  {
                    id: "content-dda-tc-1",
                    type: "video",
                    url: "https://example.com/video-dda-tc.mp4",
                    title: "Vidéo TC DDA",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "lab",
    name: "LAB - Formation Courte",
    type: "courte",
    modules: [
      {
        id: "module-lab-1",
        name: "Module 1: Bases",
        chapters: [
          {
            id: "chapter-lab-1-1",
            name: "Chapitre 1: Introduction",
            courses: [
              {
                id: "course-lab-1-1-1",
                name: "Cours LAB 1.1.1: Introduction",
                durationSeconds: 1200, // 20 minutes
                contents: [
                  {
                    id: "content-lab-1",
                    type: "video",
                    url: "https://example.com/video-lab-1.mp4",
                    title: "Vidéo introduction LAB",
                  },
                  {
                    id: "content-lab-2",
                    type: "pdf",
                    url: "https://example.com/pdf-lab-1.pdf",
                    title: "Support LAB",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "dci",
    name: "DCI - Formation Courte",
    type: "courte",
    modules: [
      {
        id: "module-dci-1",
        name: "Module 1: Bases",
        chapters: [
          {
            id: "chapter-dci-1-1",
            name: "Chapitre 1: Introduction",
            courses: [
              {
                id: "course-dci-1-1-1",
                name: "Cours DCI 1.1.1: Introduction",
                durationSeconds: 1200, // 20 minutes
                contents: [
                  {
                    id: "content-dci-1",
                    type: "video",
                    url: "https://example.com/video-dci-1.mp4",
                    title: "Vidéo introduction DCI",
                  },
                  {
                    id: "content-dci-2",
                    type: "pdf",
                    url: "https://example.com/pdf-dci-1.pdf",
                    title: "Support DCI",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// Helper to get formation by ID
export function getFormationById(formationId) {
  return formations.find((f) => f.id === formationId);
}

/**
 * Map formation IDs from config format to mock format
 * Converts IDs like "iobsp-1" to "iobsp", "ias-1" to "ias", etc.
 */
function mapFormationId(formationId) {
  // Mapping des IDs de config vers mock
  const idMapping = {
    "iobsp-1": "iobsp",
    "ias-1": "ias",
    // Les autres IDs restent identiques (dci, dda, lab)
  };
  
  return idMapping[formationId] || formationId;
}

// Helper to get all formations (filtered by entitlements in production)
export function getFormations(entitlements = null) {
  if (!entitlements || entitlements.length === 0) {
    // MVP: return all formations
    return formations;
  }
  
  // Mapper les entitlements vers les IDs du mock
  const mappedEntitlements = entitlements.map(mapFormationId);
  console.log('[getFormations] Entitlements originaux:', entitlements);
  console.log('[getFormations] Entitlements mappés:', mappedEntitlements);
  
  const filtered = formations.filter((f) => mappedEntitlements.includes(f.id));
  console.log('[getFormations] Formations filtrées:', filtered.map(f => f.id));
  
  return filtered;
}

