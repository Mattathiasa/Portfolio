import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  setDoc, getDoc, orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { Project, Skill, PortfolioContent, CVData, AboutHighlight, ContactData, BlogPost } from '@/types/portfolio';

// ── Projects ────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const q = query(collection(db, 'projects'), orderBy('order'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
}

export async function addProject(project: Omit<Project, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'projects'), {
    ...project,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProject(id: string, data: Partial<Project>): Promise<void> {
  await updateDoc(doc(db, 'projects', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', id));
}

// ── Skills ───────────────────────────────────────────────────────────────────

export async function getSkills(): Promise<Skill[]> {
  const q = query(collection(db, 'skills'), orderBy('order'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Skill));
}

export async function addSkill(skill: Omit<Skill, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'skills'), skill);
  return ref.id;
}

export async function updateSkill(id: string, data: Partial<Skill>): Promise<void> {
  await updateDoc(doc(db, 'skills', id), data);
}

export async function deleteSkill(id: string): Promise<void> {
  await deleteDoc(doc(db, 'skills', id));
}

// ── Tools ─────────────────────────────────────────────────────────────────────

export async function getTools(): Promise<string[]> {
  const snap = await getDoc(doc(db, 'content', 'tools'));
  if (snap.exists()) return (snap.data().items as string[]) ?? [];
  return [];
}

export async function setTools(tools: string[]): Promise<void> {
  await setDoc(doc(db, 'content', 'tools'), { items: tools });
}

// ── Portfolio content (hero / about) ─────────────────────────────────────────

export async function getContent(): Promise<PortfolioContent | null> {
  const snap = await getDoc(doc(db, 'content', 'main'));
  if (snap.exists()) return snap.data() as PortfolioContent;
  return null;
}

export async function saveContent(data: Partial<PortfolioContent>): Promise<void> {
  await setDoc(doc(db, 'content', 'main'), data, { merge: true });
}

// ── About highlights ──────────────────────────────────────────────────────────

export async function getHighlights(): Promise<AboutHighlight[] | null> {
  const snap = await getDoc(doc(db, 'content', 'highlights'));
  if (snap.exists()) return snap.data().items as AboutHighlight[];
  return null;
}

export async function saveHighlights(items: AboutHighlight[]): Promise<void> {
  await setDoc(doc(db, 'content', 'highlights'), { items });
}

// ── Contact ───────────────────────────────────────────────────────────────────

export async function getContactData(): Promise<ContactData | null> {
  const snap = await getDoc(doc(db, 'content', 'contact'));
  if (snap.exists()) return snap.data() as ContactData;
  return null;
}

export async function saveContactData(data: ContactData): Promise<void> {
  await setDoc(doc(db, 'content', 'contact'), data);
}

// ── Blog posts ────────────────────────────────────────────────────────────────

export async function getBlogPosts(): Promise<BlogPost[]> {
  const q = query(collection(db, 'blog'), orderBy('order'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
}

export async function addBlogPost(post: Omit<BlogPost, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'blog'), { ...post, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateBlogPost(id: string, data: Partial<BlogPost>): Promise<void> {
  await updateDoc(doc(db, 'blog', id), data);
}

export async function deleteBlogPost(id: string): Promise<void> {
  await deleteDoc(doc(db, 'blog', id));
}

// ── CV ────────────────────────────────────────────────────────────────────────

export async function getCV(): Promise<CVData | null> {
  const snap = await getDoc(doc(db, 'content', 'cv'));
  if (snap.exists()) return snap.data() as CVData;
  return null;
}

export async function saveCV(data: CVData): Promise<void> {
  await setDoc(doc(db, 'content', 'cv'), data);
}

// ── File uploads ──────────────────────────────────────────────────────────────

export async function uploadProjectImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const storageRef = ref(storage, `projects/${Date.now()}.${ext}`);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
}

export async function uploadCV(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const storageRef = ref(storage, `cv/resume.${ext}`);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
}

// ── Seed helpers (run once from admin) ───────────────────────────────────────

export async function seedSkills(skills: Omit<Skill, 'id'>[]): Promise<void> {
  await Promise.all(
    skills.map((s, i) => addDoc(collection(db, 'skills'), { ...s, order: i }))
  );
}

export async function seedTools(tools: string[]): Promise<void> {
  await setTools(tools);
}
