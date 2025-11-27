import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBook,
  FaYoutube,
  FaFilePdf,
  FaSearch,
  FaStar,
  FaRegStar,
  FaFilter,
} from "react-icons/fa";

export default function ELearning() {
  const [activeSection, setActiveSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [favorites, setFavorites] = useState([]);

  // Load favorites from localStorage on first render
  useEffect(() => {
    const stored = localStorage.getItem("favorites");
    if (stored) setFavorites(JSON.parse(stored));
  }, []);

  // Save favorites whenever they change
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (name) => {
    setFavorites((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const sections = [
    {
      title: "Pre-Primary",
      color: "text-yellow-300",
      description:
        "Fun learning through colors, rhymes, alphabets, numbers, and storytelling.",
      subjects: [
        {
          name: "English",
          category: "English",
          pdf: "https://example.com/preprimary-english.pdf",
          youtube: "https://youtu.be/QahSR-a6raQ?si=nc5qL4usWJzR1hk1",
          paragraph:
            "Children learn alphabets, simple words, and phonics through visuals and songs.",
        },
        {
          name: "Mathematics",
          category: "Math",
          pdf: "https://example.com/preprimary-maths.pdf",
          youtube: "https://youtu.be/mjlsSYLLOSE?si=IM8xwBkapjbIG95C",
          paragraph:
            "Basic number recognition, counting, and fun shapes learning through activities.",
        },
        {
          name: "Science",
          category: "Science",
          pdf: "https://example.com/preprimary-science.pdf",
          youtube: "https://youtu.be/dktnOPfE7Dc?si=7mEdqjMHwPBxMh4s",
          paragraph:
            "Understanding the environment — plants, animals, and seasons through simple stories.",
        },
      ],
    },
    {
      title: "Primary",
      color: "text-green-300",
      description:
        "Focuses on core subjects with activity-based learning, problem-solving, and imagination building.",
      subjects: [
        {
          name: "English",
          category: "English",
          pdf: "https://example.com/primary-english.pdf",
          youtube: "https://youtu.be/by1QAoRcc-U?si=-AXAhp-46LUVLMkS",
          paragraph:
            "Grammar, storytelling, and vocabulary enhancement through reading and discussions.",
        },
        {
          name: "Mathematics",
          category: "Math",
          pdf: "https://example.com/primary-maths.pdf",
          youtube: "https://youtu.be/1Pu4b9NHwps?si=_pqXsIyA_7IH8Jyc",
          paragraph:
            "Understanding addition, subtraction, multiplication, and geometry using fun games.",
        },
        {
          name: "Science",
          category: "Science",
          pdf: "https://example.com/primary-science.pdf",
          youtube: "https://youtu.be/OSsntU6sTWI?si=gjRBMgbbct1JPUc2",
          paragraph:
            "Learning about the human body, solar system, and basic experiments in nature.",
        },
      ],
    },
    {
      title: "Upper-Primary",
      color: "text-blue-300",
      description:
        "Strengthening the base for high school through experiments, reasoning, and digital literacy.",
      subjects: [
        {
          name: "English",
          category: "English",
          pdf: "https://example.com/upperprimary-english.pdf",
          youtube: "https://youtu.be/TbmSCdn_iUo?si=5Ua0QT1FqWGYlH8x",
          paragraph:
            "Advanced grammar, writing skills, literature comprehension, and reading analysis.",
        },
        {
          name: "Mathematics",
          category: "Math",
          pdf: "https://example.com/upperprimary-maths.pdf",
          youtube: "https://youtube.com/shorts/QfJoTnr1BB8?si=iv_HU-MpEmHhgISG",
          paragraph:
            "Pre-algebra, data handling, measurements, and problem-solving through logic building.",
        },
        {
          name: "Science",
          category: "Science",
          pdf: "https://example.com/upperprimary-science.pdf",
          youtube: "https://www.youtube.com/watch?v=n9A9Nwlv_kU",
          paragraph:
            "Introduction to physics, chemistry, and biology with small experiments.",
        },
      ],
    },
  ];

  // Filtered and searched results
  const filteredSections = useMemo(() => {
    let list = sections;

    // Apply search term
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list
        .map((sec) => ({
          ...sec,
          subjects: sec.subjects.filter(
            (sub) =>
              sub.name.toLowerCase().includes(lower) ||
              sub.paragraph.toLowerCase().includes(lower)
          ),
        }))
        .filter((sec) => sec.subjects.length > 0);
    }

    // Apply category filter
    if (filter !== "All") {
      list = list
        .map((sec) => ({
          ...sec,
          subjects: sec.subjects.filter((sub) =>
            filter === "Favorites"
              ? favorites.includes(sub.name)
              : sub.category === filter
          ),
        }))
        .filter((sec) => sec.subjects.length > 0);
    }

    return list;
  }, [searchTerm, filter, favorites]);

  return (
    <div className="min-h-screen text-white p-6 md:p-10 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <h1 className="text-4xl font-bold text-center mb-10">
        🎓 E-Learning Portal
      </h1>

      {/* Search & Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between max-w-4xl mx-auto mb-10">
        {/* Search */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-md w-full sm:w-2/3">
          <FaSearch className="text-white/70 text-lg" />
          <input
            type="text"
            placeholder="Search subjects or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent w-full outline-none text-white placeholder-white/50"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
            <FaFilter className="text-white/70" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent text-black outline-none font-semibold"
            >
              <option value="All">All</option>
              <option value="Science">Science</option>
              <option value="Math">Math</option>
              <option value="English">English</option>
              <option value="Favorites">⭐ Favorites</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <AnimatePresence>
        {filteredSections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredSections.map((sec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.15 }}
                className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl transition duration-300"
              >
                <h2 className={`text-2xl font-bold mb-3 ${sec.color}`}>
                  {sec.title}
                </h2>
                <p className="text-sm mb-4 leading-relaxed">
                  {sec.description}
                </p>

                <button
                  onClick={() =>
                    setActiveSection(activeSection === idx ? null : idx)
                  }
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition"
                >
                  {activeSection === idx ? "Hide Subjects" : "View Subjects"}
                </button>

                {/* Subject Cards */}
                <AnimatePresence>
                  {activeSection === idx && (
                    <motion.div
                      key="subjects"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="overflow-hidden mt-5 space-y-5"
                    >
                      {sec.subjects.map((sub, sidx) => {
                        const isFav = favorites.includes(sub.name);
                        return (
                          <motion.div
                            key={sidx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: sidx * 0.1 }}
                            className="bg-white/10 rounded-xl p-4 border border-white/10 hover:bg-white/20 transition transform hover:scale-[1.02] duration-300"
                          >
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-bold flex items-center gap-2">
                                <FaBook className="text-yellow-300" />
                                {sub.name}
                              </h3>
                              <button
                                onClick={() => toggleFavorite(sub.name)}
                                className="text-yellow-400 hover:scale-110 transition"
                              >
                                {isFav ? (
                                  <FaStar className="text-yellow-400" />
                                ) : (
                                  <FaRegStar className="text-white/70" />
                                )}
                              </button>
                            </div>
                            <p className="text-sm mb-3 opacity-90">
                              {sub.paragraph}
                            </p>

                            <div className="flex flex-wrap gap-3">
                              <a
                                href={sub.pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-semibold transition"
                              >
                                <FaFilePdf /> PDF
                              </a>
                              <a
                                href={sub.youtube}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-semibold transition"
                              >
                                <FaYoutube /> YouTube
                              </a>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-lg opacity-70"
          >
            ❌ No results found for “{searchTerm}”.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}





