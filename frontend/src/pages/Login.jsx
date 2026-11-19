import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LockKeyhole, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showError, showSuccess } from '@/utils/toast';

const initialProfile = { fullName: '', branch: '', course: '', yearOfStudy: '' };
const courses = ['B.Tech', 'M.Tech', 'MCA', 'B. Pharm', 'MBA'];
const branches = [
    'CSE',
    'CS',
    'CSE(AI)',
    'CSE(AIML)',
    'CSIT',
    'IT',
    'CSE(CYBER SECURITY)',
    'CSE(DATA SCIENCE)',
    'EEE',
    'ELCE',
    'ECE',
    'MECHANICAL',
    'VLSI',
];

const LoginPage = () => {
    const { currentUser, requiresPasswordSetup, sendSignupOtp, verifyEmailOtp, sendPasswordResetOtp, updatePassword, signIn, isLoading, demoMode, signInDemo } = useAuth();
    const [mode, setMode] = useState('signin');
    const [signupStage, setSignupStage] = useState('details');
    const [resetStage, setResetStage] = useState('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profile, setProfile] = useState(initialProfile);
    const [busy, setBusy] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && currentUser && requiresPasswordSetup && mode === 'signin') {
            setMode('reset');
            setResetStage('password');
            return;
        }
        if (!isLoading && currentUser && !requiresPasswordSetup)
            navigate('/', { replace: true });
    }, [currentUser, isLoading, mode, navigate, requiresPasswordSetup]);

    const settingPassword = mode === 'signup' ? signupStage === 'password' : mode === 'reset' && resetStage === 'password';

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (demoMode) {
            try {
                signInDemo(email);
                showSuccess('Demo access enabled. Backend features require Supabase setup.');
                navigate('/', { replace: true });
            }
            catch (error) {
                showError(error instanceof Error ? error.message : 'Could not start the demo.');
            }
            return;
        }

        if (settingPassword && password !== confirmPassword) {
            showError('The passwords do not match.');
            return;
        }
        setBusy(true);
        try {
            if (mode === 'signup' && signupStage === 'details') {
                await sendSignupOtp({ email, profile });
                setSignupStage('code');
                showSuccess('We sent a verification code to your KIET email.');
            }
            else if (mode === 'signup' && signupStage === 'code') {
                await verifyEmailOtp(email, otp);
                setOtp('');
                setSignupStage('password');
                showSuccess('Email verified. Create your password to finish signup.');
            }
            else if (mode === 'reset' && resetStage === 'email') {
                await sendPasswordResetOtp(email);
                setResetStage('code');
                showSuccess('If this email has an account, a verification code has been sent.');
            }
            else if ((mode === 'signup' && signupStage === 'password') || (mode === 'reset' && resetStage === 'password')) {
                await updatePassword(password);
                showSuccess(mode === 'signup' ? 'Your account and student profile are ready.' : 'Your password has been updated.');
                navigate('/', { replace: true });
            }
            else if (mode === 'reset' && resetStage === 'code') {
                await verifyEmailOtp(email, otp);
                setOtp('');
                setResetStage('password');
                showSuccess('Email verified. Choose a new password.');
            }
            else {
                await signIn(email, password);
                showSuccess('You are signed in. Welcome to campXsolutions!');
                navigate('/', { replace: true });
            }
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Authentication could not be completed.');
        }
        finally {
            setBusy(false);
        }
    };

    const updateProfile = (field) => (event) => setProfile((current) => ({ ...current, [field]: event.target.value }));
    const updateCourse = (event) => setProfile((current) => ({
        ...current,
        course: event.target.value,
        branch: '',
        yearOfStudy: '',
    }));
    const changeMode = (nextMode) => {
        setMode(nextMode);
        setSignupStage('details');
        setResetStage('email');
        setOtp('');
        setPassword('');
        setConfirmPassword('');
    };
    const authUnavailable = !demoMode && !isSupabaseConfigured;
    const activeStage = mode === 'signup' ? signupStage : resetStage;
    const showProfile = mode === 'signup' && signupStage === 'details' && !demoMode;
    const showEmail = mode === 'signin' || (mode === 'signup' && signupStage === 'details') || (mode === 'reset' && resetStage === 'email');
    const showOtp = mode !== 'signin' && activeStage === 'code';
    const showPassword = mode === 'signin' || activeStage === 'password';
    const heading = demoMode ? 'Explore the demo' : mode === 'signin' ? 'Welcome back' :
        mode === 'signup' ? signupStage === 'details' ? 'Create your account' : signupStage === 'code' ? 'Verify your email' : 'Create a password' :
            resetStage === 'email' ? 'Reset your password' : resetStage === 'code' ? 'Verify your email' : 'Choose a new password';
    const description = demoMode ? 'Enter a KIET email address to preview the app without creating an account.' :
        mode === 'signin' ? 'Sign in with the password you created to continue.' :
            mode === 'signup' ? signupStage === 'details' ? 'Add your student profile. We will verify your email before you create a password.' :
                signupStage === 'code' ? `Enter the verification code sent to ${email}.` : 'Your email is verified. Choose a password for your new account.' :
                resetStage === 'email' ? 'Enter the email address on your account and we will send a verification code.' :
                    resetStage === 'code' ? `Enter the verification code sent to ${email}.` : 'Your email is verified. Choose a new password.';
    const submitLabel = busy ? 'Please wait…' : demoMode ? 'Continue to campXsolutions' :
        mode === 'signin' ? 'Sign in' :
            mode === 'signup' ? signupStage === 'details' ? 'Send verification code' : signupStage === 'code' ? 'Verify email' : 'Create account' :
                resetStage === 'email' ? 'Send verification code' : resetStage === 'code' ? 'Verify email' : 'Update password';

    return (<main className="campus-login min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="campus-login-hero relative hidden overflow-hidden px-12 py-10 text-white lg:flex lg:flex-col">
          <div className="absolute -right-36 -top-28 h-[530px] w-[530px] rounded-full border border-white/10"/>
          <div className="absolute -right-20 -top-12 h-[410px] w-[410px] rounded-full border border-white/10"/>
          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d0f16e] text-[#102b25]"><MapPin size={22} strokeWidth={2.8}/></div>
            <span className="text-xl font-bold tracking-tight">campXsolutions</span>
          </div>
          <div className="relative my-auto max-w-xl pb-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#d0f16e]">
              <span className="h-2 w-2 rounded-full bg-[#d0f16e]"/> KIET campus community
            </div>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight xl:text-[64px]">
              Lost Something?<br />Let&apos;s Bring It <span className="font-serif italic text-[#efffbd]">Back!</span>
            </h1>
            <p className="mt-6 max-w-md text-lg font-semibold leading-8 text-white">Buy, Sell &amp; Rediscover Your College Essentials — All in One Place.</p>
            <p className="mt-3 max-w-md text-base leading-7 text-white/75">A smarter way to find what you need, sell what you no longer use, and give your college essentials a second life!</p>
            <div className="mt-12 flex max-w-md items-center rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="flex -space-x-2">
                {['A', 'R', 'S', 'M'].map((initial, index) => (<div key={initial} className={`grid h-9 w-9 place-items-center rounded-full border-2 border-[#102b25] text-xs font-semibold text-[#102b25] ${['bg-[#e8b6a4]', 'bg-[#d0f16e]', 'bg-[#a8c5e3]', 'bg-[#eccd87]'][index]}`}>{initial}</div>))}
              </div>
              <div className="ml-4 text-sm">
                <div className="font-medium">Good things happen here</div>
                <div className="mt-0.5 text-white/55">Students helping students, every day</div>
              </div>
              <CheckCircle2 className="ml-auto text-[#d0f16e]" size={21}/>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-white/45"><ShieldCheck size={15}/> Private to the KIET community</div>
          </div>
          <div className="relative flex justify-between text-xs text-white/35"><span>© 2026 campXsolutions</span><span>Made for campus life</span></div>
        </section>

        <section className="flex min-h-screen flex-col bg-[#f7f8f4] px-6 py-7 sm:px-10 lg:px-14">
          <div className="flex items-center gap-3 lg:invisible">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#173b30] text-[#d0f16e]"><MapPin size={20}/></div>
            <span className="text-lg font-bold text-[#173b30]">campXsolutions</span>
          </div>
          <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
            <div className="mb-7">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f0df] text-[#315b3f]">
                {mode === 'signup' ? <UserRound size={22}/> : <LockKeyhole size={22}/>}
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6c8a68]">KIET students &amp; staff</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#172821]">{heading}</h2>
              <p className="mt-3 text-sm leading-6 text-[#728078]">{description}</p>
            </div>

            {demoMode ? (<div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">Demo mode only: this does not create or verify an account. Listings, reports, claims, and chat require Supabase.</div>) :
              authUnavailable && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
                Configure Supabase to enable account access. See the project setup instructions for the required environment variables.
              </div>}

            {!demoMode && mode !== 'reset' && <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#e9ede6] p-1" role="tablist" aria-label="Account action">
              <button type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => changeMode('signin')} className={`rounded-lg px-3 py-2.5 text-sm font-medium ${mode === 'signin' ? 'bg-white text-[#173b30] shadow-sm' : 'text-[#718078]'}`}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => changeMode('signup')} className={`rounded-lg px-3 py-2.5 text-sm font-medium ${mode === 'signup' ? 'bg-white text-[#173b30] shadow-sm' : 'text-[#718078]'}`}>Create account</button>
            </div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {showProfile && <div className="space-y-4 rounded-2xl border border-[#e4e8df] bg-white p-4">
                <p className="text-sm font-semibold text-[#26392e]">Student profile</p>
                <Input aria-label="Full name" autoComplete="name" placeholder="Full name" maxLength={100} required value={profile.fullName} onChange={updateProfile('fullName')} className="h-11 rounded-xl border-[#dfe5dc]"/>
                <label className="block space-y-2 text-sm font-medium text-[#26392e]" htmlFor="course">
                  Course
                  <select id="course" value={profile.course} onChange={updateCourse} required className="h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm font-normal">
                    <option value="" disabled>Select your course</option>
                    {courses.map((course) => <option key={course} value={course}>{course}</option>)}
                  </select>
                </label>
                {profile.course === 'B.Tech' && <label className="block space-y-2 text-sm font-medium text-[#26392e]" htmlFor="branch">
                  Branch
                  <select id="branch" value={profile.branch} onChange={updateProfile('branch')} required className="h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm font-normal">
                    <option value="" disabled>Select your branch</option>
                    {branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
                  </select>
                </label>}
                {profile.course && <label className="block space-y-2 text-sm font-medium text-[#26392e]" htmlFor="year-of-study">
                  Year of study
                  <select id="year-of-study" value={profile.yearOfStudy} onChange={updateProfile('yearOfStudy')} required className="h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm font-normal">
                    <option value="" disabled>Select your year</option>
                    {Array.from({ length: profile.course === 'B.Tech' || profile.course === 'B. Pharm' ? 4 : 2 }, (_, index) => index + 1).map((year) => <option key={year} value={year}>Year {year}</option>)}
                  </select>
                </label>}
                <p className="text-xs leading-5 text-[#849087]">If this email already has an account, sign in or use password reset instead of creating another account.</p>
              </div>}
              {showEmail && <div className="space-y-2">
                <label htmlFor="campus-email" className="text-sm font-medium text-[#26392e]">KIET email address</label>
                <Input id="campus-email" autoComplete="email" type="email" placeholder="you@kiet.edu" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} className="h-12 rounded-xl border-[#dfe5dc] bg-white px-4 text-sm shadow-none focus-visible:ring-[#557a54]"/>
                <p className="text-xs text-[#8a958d]">Only email addresses ending in @kiet.edu are accepted.</p>
              </div>}
              {showOtp && <div className="space-y-3">
                <label htmlFor="campus-otp" className="text-sm font-medium text-[#26392e]">6-digit verification code</label>
                <Input id="campus-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required className="h-12 rounded-xl border-[#dfe5dc] bg-white px-4 text-center text-lg tracking-[0.35em] shadow-none focus-visible:ring-[#557a54]"/>
                <button type="button" onClick={() => { setOtp(''); mode === 'signup' ? setSignupStage('details') : setResetStage('email'); }} className="text-xs font-medium text-[#52754f] hover:underline">Use a different email</button>
              </div>}
              {showPassword && !demoMode && <div className="space-y-2">
                <label htmlFor="campus-password" className="text-sm font-medium text-[#26392e]">{mode === 'signin' ? 'Password' : mode === 'signup' ? 'Create password' : 'New password'}</label>
                <Input id="campus-password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} type="password" minLength={mode === 'signin' ? undefined : 8} maxLength={128} placeholder={mode === 'signin' ? 'Your password' : 'At least 8 characters'} value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12 rounded-xl border-[#dfe5dc] bg-white px-4 text-sm shadow-none focus-visible:ring-[#557a54]"/>
              </div>}
              {settingPassword && <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-[#26392e]">Confirm password</label>
                <Input id="confirm-password" autoComplete="new-password" type="password" minLength={8} maxLength={128} placeholder="Enter your password again" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required className="h-12 rounded-xl border-[#dfe5dc] bg-white px-4 text-sm shadow-none focus-visible:ring-[#557a54]"/>
              </div>}
              <Button type="submit" disabled={busy || (!demoMode && authUnavailable)} className="h-12 w-full rounded-xl bg-[#173b30] text-sm font-semibold text-white hover:bg-[#245342]">
                {submitLabel}
                {!busy && <ArrowRight className="ml-2" size={17}/>}
              </Button>
            </form>

            {!demoMode && mode === 'signin' && <button type="button" onClick={() => changeMode('reset')} className="mt-4 self-center text-sm font-medium text-[#52754f] hover:underline">Forgot or need to change your password?</button>}
            {!demoMode && mode === 'reset' && <button type="button" onClick={() => changeMode('signin')} className="mt-4 self-center text-sm font-medium text-[#52754f] hover:underline">Back to sign in</button>}

            <div className="mt-8 flex items-start gap-3 rounded-xl border border-[#e4e8df] bg-white/70 p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#65825e]"/>
              <p className="text-xs leading-5 text-[#78847b]">Your password is managed securely by Supabase.</p>
            </div>
          </div>
          <p className="text-center text-xs text-[#9ca69e] lg:text-right">campXsolutions · A safer way to find what matters</p>
        </section>
      </div>
    </main>);
};

export default LoginPage;
