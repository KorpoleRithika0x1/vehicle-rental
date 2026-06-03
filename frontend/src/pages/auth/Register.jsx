import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, validatePhone } from '../../utils/validators';

// ── Live camera capture component ──────────────────────────────────────────
function LivePhotoCapture({ onCapture, error }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [starting, setStarting] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      // Attach stream after state update so the video element is visible in DOM
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(() => {});
          };
        }
      });
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera permissions and try again.');
    } finally {
      setStarting(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    // Convert data-url → File
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const file = new File([ab], 'live_photo.jpg', { type: 'image/jpeg' });
    stopCamera();
    setCapturedImage(dataUrl);
    onCapture(file);
  }, [stopCamera, onCapture]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    onCapture(null);
    startCamera();
  }, [startCamera, onCapture]);

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-600">Live Photo</label>

      {/* Captured preview */}
      {capturedImage ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <img src={capturedImage} alt="Captured live photo" className="h-48 w-full object-cover" />
          <div className="flex items-center justify-between bg-emerald-50 px-4 py-2">
            <span className="text-xs font-medium text-emerald-700">✓ Photo captured</span>
            <button
              type="button"
              onClick={retake}
              className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Retake
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Video element — always in DOM so ref is stable; hidden when camera is off */}
          <div className={`overflow-hidden rounded-2xl border border-slate-200 ${cameraActive ? 'block' : 'hidden'}`}>
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className="h-48 w-full bg-black object-cover"
            />
            <div className="flex items-center justify-center gap-3 bg-slate-900 px-4 py-3">
              <button
                type="button"
                onClick={capture}
                className="flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
                Capture Photo
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="rounded-full border border-slate-500 px-4 py-2 text-xs font-medium text-slate-300 hover:border-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Start camera prompt — shown when camera is off */}
          {!cameraActive && (
            <div
              className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-brand hover:bg-brand/5 transition-colors"
              onClick={startCamera}
            >
              {starting ? (
                <span className="text-sm text-slate-500">Starting camera…</span>
              ) : (
                <>
                  <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-600">Click to open camera</span>
                  <span className="text-xs text-slate-400">Face the camera directly, good lighting, no sunglasses</span>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {cameraError && <p className="mt-2 text-sm text-rose-600">{cameraError}</p>}
      {error && !cameraError && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}

// ── Main Register page ──────────────────────────────────────────────────────
export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone_number: '', password: '' });
  const [licenseFile, setLicenseFile] = useState(null);
  const [livePhotoFile, setLivePhotoFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { registerCustomer } = useAuth();
  const pendingKey = 'customer_registration_pending';
  const pendingEmailKey = 'customer_registration_pending_email';

  useEffect(() => {
    if (sessionStorage.getItem(pendingKey) === 'true') {
      setSubmitted(true);
    }
  }, []);

  function handleChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!validateEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!validatePassword(form.password)) nextErrors.password = 'Password must include 8 characters, one uppercase, and one number.';
    if (!validatePhone(form.phone_number)) nextErrors.phone_number = 'Phone number format is invalid.';
    if (!licenseFile) nextErrors.license_image = 'Driving license image is required.';
    else if (licenseFile.size > 5 * 1024 * 1024) nextErrors.license_image = 'File must be under 5MB.';
    else if (!licenseFile.type.startsWith('image/')) nextErrors.license_image = 'Must be an image file.';
    if (!livePhotoFile) nextErrors.live_photo = 'Please capture a live photo using your camera.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      await registerCustomer({ ...form, license_image: licenseFile, live_photo: livePhotoFile });
      sessionStorage.setItem(pendingKey, 'true');
      sessionStorage.setItem(pendingEmailKey, form.email.trim().toLowerCase());
      setSubmitted(true);
    } catch (error) {
      setErrors({ general: error.normalizedMessage || 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="rounded-[2.5rem] bg-emerald-50 p-12 shadow-soft">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-heading text-3xl text-ink">Verification Submitted</h2>
          <p className="mt-4 text-slate-600">
            Your account is under review. A manager will verify your license and live photo before approving access.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {sessionStorage.getItem(pendingEmailKey)
              ? `We have received the request for ${sessionStorage.getItem(pendingEmailKey)}.`
              : 'You can safely close this page and come back later.'}
          </p>
          <p className="mt-2 text-sm text-slate-500">You will receive access once your account is approved.</p>
          <Link to="/login" className="mt-8 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
      <div className="rounded-[2.5rem] bg-brand p-10 text-white shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">Create your account</p>
        <h1 className="mt-6 font-heading text-5xl">Start booking with the same platform fleet teams rely on.</h1>
        <p className="mt-5 text-slate-200">
          Registration creates a customer account. Your driving license and a live photo are required for verification before you can log in.
        </p>
      </div>
      <div className="glass-panel p-8">
        <h2 className="font-heading text-4xl text-ink">Register</h2>
        {errors.general ? (
          <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{errors.general}</div>
        ) : null}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Full name</label>
            <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            {errors.name ? <p className="mt-2 text-sm text-rose-600">{errors.name}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Email</label>
            <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Phone number</label>
            <input value={form.phone_number} onChange={(e) => handleChange('phone_number', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            {errors.phone_number ? <p className="mt-2 text-sm text-rose-600">{errors.phone_number}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Password</label>
            <input type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password}</p> : null}
          </div>

          {/* Driving License — file upload */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Driving License Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white focus:border-brand focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">Upload the front side of your driving license</p>
            {errors.license_image ? <p className="mt-2 text-sm text-rose-600">{errors.license_image}</p> : null}
          </div>

          {/* Live Photo — camera capture only */}
          <LivePhotoCapture onCapture={setLivePhotoFile} error={errors.live_photo} />

          <button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isSubmitting ? 'Submitting...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
