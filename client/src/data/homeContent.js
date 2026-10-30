import {
  Building2,
  BookOpen,
  ChartNoAxesCombined,
  Files,
  Flame,
  GraduationCap,
  Landmark,
  ListOrdered,
  NotebookPen,
  PanelsTopLeft,
} from "lucide-react";

// Exam cards on the home page. `slug` matches the exams seeded in the database.
export const examCards = [
  { slug: "ossc-cgl", icon: Landmark, name: "OSSC CGL", board: "Odisha Staff Selection Commission", detail: "Combined graduate level" },
  { slug: "osssc-ri", icon: Files, name: "OSSSC", board: "Odisha Sub-ordinate Staff Selection Commission", detail: "RI · ARI · Amin · CRE" },
  { slug: "opsc-ocs", icon: Building2, name: "OPSC OCS", board: "Odisha Public Service Commission", detail: "Odisha civil services" },
  { slug: "otet", icon: GraduationCap, name: "OTET", board: "Board of Secondary Education, Odisha", detail: "Teacher eligibility test" },
  { slug: "osstet", icon: BookOpen, name: "OSSTET", board: "Board of Secondary Education, Odisha", detail: "Secondary teacher eligibility" },
  { slug: "bed-entrance", icon: NotebookPen, name: "B.Ed Entrance", board: "Higher Education Department, Odisha", detail: "Teacher education entrance" },
];

export const features = [
  { icon: ListOrdered, title: "PYQs in sequence", body: "Practise papers exactly as they appeared. Learn the pattern, not just the answers." },
  { icon: PanelsTopLeft, title: "Real exam interface", body: "Get comfortable with the timer, sections and question palette before exam day." },
  { icon: ChartNoAxesCombined, title: "Performance dashboard", body: "See your score trends and weak topics. Make every practice session count." },
  { icon: Flame, title: "A little, every day", body: "Build a daily streak with quick quizzes. Small steps add up to exam-day confidence." },
];

export const principles = [
  { full: "7 exam pathways", short: null },
  { full: "Real previous-year papers", short: "Real PYQs" },
  { full: "English & Odia practice", short: "Bilingual" },
  { full: "Free, from start to finish", short: "Always free" },
];
