import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Video, BookOpen, HelpCircle, Search, Tag } from "lucide-react";
import { videos, successStories, faqs, categoryLabels, type ContentCategory } from "../data/educationalContent";
import { useAchievementState } from "../state/achievementState";

interface EducationalLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "videos" | "stories" | "faqs";

export const EducationalLibrary: FC<EducationalLibraryProps> = ({ isOpen, onClose }) => {
  const markLibraryOpened = useAchievementState((s) => s.markLibraryOpened);
  const [activeTab, setActiveTab] = useState<Tab>("videos");

  useEffect(() => {
    if (isOpen) markLibraryOpened();
  }, [isOpen, markLibraryOpened]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | "all">("all");

  // Filter content
  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredStories = successStories.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFaqs = faqs.filter(f => {
    const matchesSearch = f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-4 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-w-4xl mx-auto my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-l from-indigo-50 to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">مكتبة المحتوى</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Search and Filter */}
            <div className="p-4 border-b border-slate-200 space-y-3 shrink-0">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث..."
                  className="w-full pr-10 pl-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === "all"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  الكل
                </button>
                {(Object.keys(categoryLabels) as ContentCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("videos")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold transition-all ${
                  activeTab === "videos"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Video className="w-4 h-4" />
                <span className="text-sm">فيديوهات ({filteredVideos.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("stories")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold transition-all ${
                  activeTab === "stories"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">قصص ({filteredStories.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("faqs")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold transition-all ${
                  activeTab === "faqs"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">أسئلة ({filteredFaqs.length})</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {activeTab === "videos" && (
                  <motion.div
                    key="videos"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {filteredVideos.length === 0 ? (
                      <EmptyState message="لا توجد فيديوهات" />
                    ) : (
                      filteredVideos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === "stories" && (
                  <motion.div
                    key="stories"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {filteredStories.length === 0 ? (
                      <EmptyState message="لا توجد قصص" />
                    ) : (
                      filteredStories.map((story) => (
                        <StoryCard key={story.id} story={story} />
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === "faqs" && (
                  <motion.div
                    key="faqs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    {filteredFaqs.length === 0 ? (
                      <EmptyState message="لا توجد أسئلة" />
                    ) : (
                      filteredFaqs.map((faq) => (
                        <FAQCard key={faq.id} faq={faq} />
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Video Card Component
const VideoCard: FC<{ video: VideoContent }> = ({ video }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all">
    <div className="flex gap-3">
      <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0">
        <Video className="w-8 h-8 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-900 mb-1 text-sm">{video.title}</h3>
        <p className="text-xs text-slate-600 mb-2 line-clamp-2">{video.description}</p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{video.duration}</span>
          <span>•</span>
          <span>{categoryLabels[video.category]}</span>
        </div>
      </div>
    </div>
  </div>
);

// Story Card Component
const StoryCard: FC<{ story: SuccessStory }> = ({ story }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-purple-300 hover:shadow-md transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-right"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 mb-1 text-sm">{story.title}</h3>
            <p className="text-xs text-slate-600 mb-2">{story.summary}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{story.duration}</span>
              <span>•</span>
              <span>{categoryLabels[story.category]}</span>
            </div>
          </div>
        </div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4 space-y-3 text-sm"
        >
          <div className="p-3 bg-rose-50 rounded-lg">
            <p className="font-semibold text-rose-900 mb-1">قبل:</p>
            <p className="text-rose-800">{story.journey.before}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg">
            <p className="font-semibold text-amber-900 mb-1">التحدي:</p>
            <p className="text-amber-800">{story.journey.challenge}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="font-semibold text-blue-900 mb-1">الإجراء:</p>
            <p className="text-blue-800">{story.journey.action}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="font-semibold text-green-900 mb-1">بعد:</p>
            <p className="text-green-800">{story.journey.after}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// FAQ Card Component
const FAQCard: FC<{ faq: FAQItem }> = ({ faq }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-teal-300 transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-right hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
            <HelpCircle className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm">{faq.question}</h3>
            {!isExpanded && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{faq.answer}</p>
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4"
        >
          <div className="p-3 bg-teal-50 rounded-lg">
            <p className="text-sm text-teal-900 leading-relaxed">{faq.answer}</p>
          </div>
          {faq.tags && faq.tags.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {faq.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Empty State Component
const EmptyState: FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
      <Search className="w-8 h-8 text-slate-400" />
    </div>
    <p className="text-slate-500">{message}</p>
    <p className="text-xs text-slate-400 mt-1">جرب كلمات بحث أخرى</p>
  </div>
);
