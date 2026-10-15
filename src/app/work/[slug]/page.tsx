import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/data/projects";
import ProjectStory from "@/components/ProjectStory";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found — Mark Renzo" };
  return {
    title: `${project.name} — A project by Mark Renzo`,
    description: project.summary,
    openGraph: {
      title: `${project.name} — Mark Renzo`,
      description: project.summary,
      type: "article",
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];
  return (
    <ProjectStory
      project={project}
      next={{
        id: next.id,
        name: next.name,
        headline: next.headline,
        category: next.category,
      }}
      number={index + 1}
    />
  );
}
