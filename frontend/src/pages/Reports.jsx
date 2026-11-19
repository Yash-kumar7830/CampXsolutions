import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FacilityReportModal from '@/components/FacilityReportModal';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/pages/AdminDashboard';
import { createFacilityReport, getActiveSurveys, getMySurveyResponses, submitSurveyResponse } from '@/lib/campusApi';
import { isSupabaseConfigured } from '@/lib/supabase';
import { showError, showSuccess } from '@/utils/toast';

const Reports = () => {
    const { currentUser } = useAuth();
    const [surveys, setSurveys] = useState([]);
    const [responses, setResponses] = useState({});
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(null);

    const refreshSurveys = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }
        try {
            const [surveyRows, responseRows] = await Promise.all([
                getActiveSurveys(),
                getMySurveyResponses(currentUser.id),
            ]);
            setSurveys(surveyRows);
            setResponses(Object.fromEntries(responseRows.map((response) => [response.survey_id, response.answer])));
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not load campus surveys.');
        }
        finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => { void refreshSurveys(); }, [refreshSurveys]);

    const submitReport = async (report) => {
        if (!currentUser)
            throw new Error('Please sign in with your KIET email to submit a campus report.');
        if (!isSupabaseConfigured)
            throw new Error('Connect Supabase to submit a campus report.');
        await createFacilityReport(report);
    };

    const respond = async (survey) => {
        const answer = answers[survey.id];
        if (!answer)
            return;
        setSubmitting(survey.id);
        try {
            await submitSurveyResponse(survey.id, currentUser.id, answer);
            setResponses((current) => ({ ...current, [survey.id]: answer }));
            showSuccess('Your survey response has been recorded.');
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not submit your response.');
        }
        finally {
            setSubmitting(null);
        }
    };

    return (
      <main className="min-h-screen bg-[#f7f8f5] pb-20 text-[#1d2d24] dark:bg-[#0d1a13] dark:text-[#d4e8d0]">
        <div className="mx-auto max-w-[1100px] space-y-8 px-4 py-8 sm:px-7">
          <section className="rounded-3xl bg-[#183a2f] p-7 text-white sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c8df9c]">Campus reports &amp; surveys</p>
            <h1 className="mt-2 text-3xl font-bold">Help improve campus</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Report campus problems privately for management, then share your views in active student surveys.</p>
          </section>

          {!isSupabaseConfigured && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Connect Supabase to submit campus problems and respond to surveys.</div>}

          <section className="space-y-6">
            <div className="rounded-2xl border border-[#e9ede7] bg-white p-5">
              <div className="flex items-center gap-2">
                <Wrench size={19} className="text-[#597554]"/>
                <h2 className="text-lg font-semibold">Report a campus problem</h2>
              </div>
              <p className="mt-2 text-sm leading-5 text-[#718078]">Tell management about a broken facility, campus service, or other issue. Your report is private and only management can view or resolve it.</p>
              <FacilityReportModal onReportSubmit={submitReport}>
                <Button disabled={!isSupabaseConfigured} className="mt-5 w-full rounded-xl bg-[#214b3b] hover:bg-[#2a5a48]">Submit private report</Button>
              </FacilityReportModal>
            </div>

            <section className="rounded-2xl border border-[#e9ede7] bg-white p-5">
              <div className="flex items-center gap-2">
                <ClipboardList size={19} className="text-[#597554]"/>
                <h2 className="text-lg font-semibold">Student surveys</h2>
              </div>
              <p className="mt-1 text-sm text-[#849087]">Surveys created by college management. Students can respond once to each active survey.</p>
              {loading ? <p className="mt-5 text-center text-sm text-[#849087]">Loading surveys…</p> :
                surveys.length === 0 ? <p className="mt-5 rounded-xl bg-[#f7f9f5] p-5 text-center text-sm text-[#849087]">There are no active surveys right now.</p> :
                <div className="mt-4 space-y-4">
                  {surveys.map((survey) => {
                    const submittedAnswer = responses[survey.id];
                    return <article key={survey.id} className="rounded-xl border border-[#edf0eb] p-4">
                      <h3 className="font-semibold">{survey.title}</h3>
                      {survey.description && <p className="mt-1 text-sm leading-5 text-[#718078]">{survey.description}</p>}
                      <fieldset className="mt-4 space-y-2" disabled={Boolean(submittedAnswer)}>
                        <legend className="mb-2 text-sm font-medium text-[#33463a]">{survey.question}</legend>
                        {(survey.options ?? []).map((option) => (
                          <label key={option} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#edf0eb] p-3 text-sm hover:bg-[#f7f9f5]">
                            <input type="radio" name={`survey-${survey.id}`} value={option} checked={(answers[survey.id] ?? submittedAnswer) === option} onChange={() => setAnswers((current) => ({ ...current, [survey.id]: option }))}/>
                            {option}
                          </label>
                        ))}
                      </fieldset>
                      {submittedAnswer ? <p className="mt-3 text-sm font-medium text-[#477148]">Your response: {submittedAnswer}</p> :
                        <Button disabled={!answers[survey.id] || submitting === survey.id} onClick={() => void respond(survey)} className="mt-3 rounded-xl bg-[#214b3b] hover:bg-[#2a5a48]">{submitting === survey.id ? 'Submitting…' : 'Submit response'}</Button>}
                    </article>;
                  })}
                </div>}
            </section>
          </section>

          {currentUser?.isAdmin && <AdminDashboard />}
        </div>
      </main>
    );
};

export default Reports;
