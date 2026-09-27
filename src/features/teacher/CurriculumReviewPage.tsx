import { CurriculumReviewQueue } from '../../components/CurriculumReviewQueue';

export default function CurriculumReviewPage() {
  return <main className="mx-auto max-w-4xl px-4 py-8">
    <h1 className="mb-3 text-2xl font-bold">Curriculum review</h1>
    <p className="mb-6 text-slate-600">Review the mappings assigned to your account against the original KICD document. Sign in with the account your administrator assigned.</p>
    <CurriculumReviewQueue />
  </main>;
}
