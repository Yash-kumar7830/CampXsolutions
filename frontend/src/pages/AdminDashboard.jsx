import React, { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { createSurvey, getFacilityReports, getAllSurveys, getSurveyResponses, updateFacilityReportStatus, updateSurveyStatus } from '@/lib/campusApi';
import { isSupabaseConfigured } from '@/lib/supabase';
import { showError, showSuccess } from '@/utils/toast';

const initialSurvey = { title: '', description: '', question: '', options: '' };
const AdminDashboard = () => {
    const { currentUser } = useAuth();
    const [reports, setReports] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [responseResults, setResponseResults] = useState({});
    const [form, setForm] = useState(initialSurvey);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [updating, setUpdating] = useState(null);

    const refresh = useCallback(async () => {
        try {
            const [reportRows, surveyRows] = await Promise.all([getFacilityReports(), getAllSurveys()]);
            const responseRows = await Promise.all(surveyRows.map(async (survey) => [survey.id, await getSurveyResponses(survey.id)]));
            setReports(reportRows);
            setSurveys(surveyRows);
            setResponseResults(Object.fromEntries(responseRows.map(([id, rows]) => {
                const breakdown = rows.reduce((counts, response) => ({
                    ...counts,
                    [response.answer]: (counts[response.answer] ?? 0) + 1,
                }), {});
                return [id, { total: rows.length, breakdown }];
            })));
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not load the staff dashboard.');
        }
        finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (currentUser?.isAdmin && isSupabaseConfigured)
            void refresh();
        else
            setLoading(false);
    }, [currentUser, refresh]);

    const createNewSurvey = async (event) => {
        event.preventDefault();
        const options = [...new Set(form.options.split('\n').map((option) => option.trim()).filter(Boolean))];
        if (options.length < 2 || options.length > 10) {
            showError('Add between 2 and 10 unique answer options, one per line.');
            return;
        }
        setSubmitting(true);
        try {
            await createSurvey({ ...form, options }, currentUser.id);
            setForm(initialSurvey);
            showSuccess('Survey published for students.');
            await refresh();
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not publish the survey.');
        }
        finally {
            setSubmitting(false);
        }
    };

    const changeReportStatus = async (report, status) => {
        setUpdating(report.id);
        try {
            await updateFacilityReportStatus(report.id, status);
            setReports((current) => current.map((entry) => entry.id === report.id ? { ...entry, status } : entry));
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not update report status.');
        }
        finally {
            setUpdating(null);
        }
    };

    const changeSurveyStatus = async (survey) => {
        const status = survey.status === 'active' ? 'closed' : 'active';
        setUpdating(survey.id);
        try {
            await updateSurveyStatus(survey.id, status);
            setSurveys((current) => current.map((entry) => entry.id === survey.id ? { ...entry, status } : entry));
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not update survey status.');
        }
        finally {
            setUpdating(null);
        }
    };

    if (!currentUser?.isAdmin) {
        return null;
    }

    return (
      <section className="space-y-6">
          <section className="rounded-3xl bg-[#183a2f] p-7 text-white sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c8df9c]">College management</p>
            <h1 className="mt-2 text-3xl font-bold">Campus operations</h1>
            <p className="mt-2 text-sm text-white/75">Only authorized college management can view and resolve private campus reports or create and manage student surveys.</p>
          </section>
          {!isSupabaseConfigured && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Connect this app to Supabase to manage reports and surveys.</div>}

          <section className="grid gap-6 lg:grid-cols-[350px_1fr]">
            <form onSubmit={createNewSurvey} className="h-fit space-y-4 rounded-2xl border border-[#e9ede7] bg-white p-5">
              <h2 className="text-lg font-semibold">Management: create a student survey</h2>
              <Input aria-label="Survey title" placeholder="Survey title" minLength={2} maxLength={100} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/>
              <Textarea aria-label="Survey description" placeholder="Description (optional)" maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/>
              <Input aria-label="Survey question" placeholder="Question" minLength={5} maxLength={300} required value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })}/>
              <Textarea aria-label="Survey options" placeholder={'Answer options, one per line\nVery satisfied\nSatisfied\nNeeds improvement'} minLength={3} maxLength={1000} required value={form.options} onChange={(event) => setForm({ ...form, options: event.target.value })}/>
              <p className="text-xs text-[#849087]">Surveys are single-choice and accept one response per signed-in KIET student.</p>
              <Button type="submit" disabled={!isSupabaseConfigured || submitting} className="w-full rounded-xl bg-[#214b3b] hover:bg-[#2a5a48]">{submitting ? 'Publishing…' : 'Publish survey'}</Button>
            </form>

            <section className="rounded-2xl border border-[#e9ede7] bg-white p-5">
              <h2 className="text-lg font-semibold">Surveys</h2>
              {loading ? <p className="mt-4 text-sm text-[#849087]">Loading…</p> :
                surveys.length === 0 ? <p className="mt-4 text-sm text-[#849087]">No surveys have been created.</p> :
                <div className="mt-4 divide-y divide-[#edf0eb]">
                  {surveys.map((survey) => <div key={survey.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{survey.title}</p>
                      <p className="mt-1 text-xs text-[#849087]">{responseResults[survey.id]?.total ?? 0} responses · {survey.question}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(survey.options ?? []).map((option) => <span key={option} className="rounded-full bg-[#f3f6f0] px-2.5 py-1 text-xs text-[#536657]">{option}: {responseResults[survey.id]?.breakdown[option] ?? 0}</span>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2"><Badge className={survey.status === 'active' ? 'bg-[#e7f3e4] text-[#47744a]' : 'bg-gray-100 text-gray-600'}>{survey.status}</Badge><Button variant="outline" size="sm" disabled={updating === survey.id} onClick={() => void changeSurveyStatus(survey)}>{survey.status === 'active' ? 'Close survey' : 'Reopen'}</Button></div>
                  </div>)}
                </div>}
            </section>
          </section>

          <section className="rounded-2xl border border-[#e9ede7] bg-white p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="text-lg font-semibold">Private campus reports</h2><p className="mt-1 text-sm text-[#849087]">Visible only to authorized management. Update each report as it is handled or resolved.</p></div>
              <div className="text-xs text-[#849087]">{reports.filter((report) => report.status !== 'resolved').length} open reports</div>
            </div>
            {loading ? <p className="mt-4 text-sm text-[#849087]">Loading…</p> :
              reports.length === 0 ? <p className="mt-4 rounded-xl bg-[#f7f9f5] p-5 text-center text-sm text-[#849087]">No facility reports have been submitted.</p> :
              <div className="mt-4 space-y-3">
                {reports.map((report) => <article key={report.id} className="rounded-xl border border-[#edf0eb] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{report.title}</h3><Badge className={report.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-[#f0f3ed] text-[#62715f]'}>{report.priority}</Badge><Badge variant="outline">{report.report_type}</Badge></div>
                      <p className="mt-1 text-xs text-[#849087]">{report.category.replaceAll('_', ' ')} · {report.location || 'No location provided'} · {new Date(report.created_at).toLocaleDateString()}</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-5 text-[#536657]">{report.description}</p>
                    </div>
                    <select aria-label={`Status for ${report.title}`} disabled={updating === report.id} value={report.status} onChange={(event) => void changeReportStatus(report, event.target.value)} className="h-9 shrink-0 rounded-md border border-input bg-white px-3 text-sm">
                      <option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option>
                    </select>
                  </div>
                </article>)}
              </div>}
          </section>
      </section>
    );
};

export default AdminDashboard;
