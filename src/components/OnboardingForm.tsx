import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  X,
  Building2,
  User,
  Mail,
  Briefcase,
  Target,
  FileUp
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface FormData {
  nombre: string;
  empresa: string;
  email: string;
  negocio: string;
  administracionActual: string;
  otroMetodo: string;
  problemas: string[];
  objetivo: string;
}

const PROBLEMAS_OPTIONS = [
  "Desorden financiero",
  "Falta de control de ingresos y gastos",
  "Demasiadas tareas administrativas",
  "Facturación desorganizada",
  "Falta de reportes claros"
];

const ADMIN_OPTIONS = [
  "Excel / Google Sheets",
  "Sistema de gestión",
  "Contador o estudio contable",
  "Yo mismo",
  "Otro"
];

export default function OnboardingForm() {
  const [step, setStep] = useState<Step>(1);
  console.log("OnboardingForm rendered, current step:", step);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState<boolean | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    empresa: '',
    email: '',
    negocio: '',
    administracionActual: '',
    otroMetodo: '',
    problemas: [],
    objetivo: ''
  });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [problema, setProblema] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("STEP CHANGE detected:", step);
  }, [step]);

  const validateStep = (currentStep: Step): boolean => {
    // Relaxed validation for testing as requested to guarantee reaching Step 6
    return true;
    
    /* Original validation logic preserved for reference
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    ...
    */
  };

  const nextStep = () => {
    console.log("nextStep called, current step:", step);
    if (validateStep(step)) {
      setStep((prev) => (prev + 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setStep((prev) => (prev - 1) as Step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleProblema = (option: string) => {
    setFormData(prev => ({
      ...prev,
      problemas: prev.problemas.includes(option)
        ? prev.problemas.filter(p => p !== option)
        : [...prev.problemas, option]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivo(file);
    }
  };

  const removeFile = () => {
    setArchivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const progress = (step / 6) * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 6) return;

    setLoading(true);
    setError(null);

    const { nombre, empresa, email, negocio: actividad, administracionActual, otroMetodo, objetivo: mejora } = formData;
    const metodoAdmin = administracionActual + (otroMetodo ? `: ${otroMetodo}` : '');

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("nombre", nombre);
    formDataToSubmit.append("empresa", empresa);
    formDataToSubmit.append("email", email);
    formDataToSubmit.append("actividad", actividad);
    formDataToSubmit.append("metodoAdmin", metodoAdmin);
    formDataToSubmit.append("problema", problema);
    formDataToSubmit.append("mejora", mejora);

    if (archivo) {
      formDataToSubmit.append("files", archivo);
    }

    console.log("FORM DATA:", [...formDataToSubmit.entries()]);

    try {
      const res = await fetch(
        "https://backend-form-bhi8.onrender.com/upload",
        {
          method: "POST",
          body: formDataToSubmit
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText || res.statusText}`);
      }

      setSuccess(true);
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err instanceof Error ? err.message : "Error desconocido al enviar el formulario");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full mb-4">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-stone-900 tracking-tight leading-tight">
              Gracias por completar el diagnóstico administrativo
            </h2>
            <p className="text-stone-500 text-lg leading-relaxed">
              En las próximas 24 horas revisaremos tu información y nos pondremos en contacto.
            </p>
          </div>
          <div className="pt-8 border-t border-stone-100">
            <p className="text-stone-400 font-serif italic text-lg">— Gerónimo adm</p>
          </div>
          <button 
            type="button"
            onClick={() => window.location.reload()}
            className="mt-8 text-stone-400 hover:text-stone-900 transition-colors text-xs font-bold tracking-widest uppercase"
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-900 font-sans selection:bg-stone-200">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-stone-100 z-50">
        <motion.div 
          className="h-full bg-stone-900"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      <main className="max-w-2xl mx-auto px-6 py-20 md:py-32">
        {/* Header */}
        <header className="mb-16 space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <span className="text-xs font-bold tracking-widest uppercase text-stone-400 mb-3 block"><span translate="no">Gerónimo adm</span></span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-stone-900">
              Diagnóstico administrativo inicial
            </h1>
            <p className="text-lg text-stone-500 max-w-lg leading-relaxed mt-4 mx-auto">
              Este breve formulario nos ayuda a entender tu empresa y detectar oportunidades de mejora administrativa.
            </p>
          </motion.div>
        </header>

        <form 
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          className="space-y-12"
        >
          {/* Debug Step Indicator */}
          <div className="fixed bottom-4 right-4 bg-stone-900 text-white px-4 py-2 rounded-full text-sm font-mono z-50 opacity-90 shadow-2xl border border-white/20">
            Current step: {step}
          </div>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.section
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-medium text-stone-800 flex items-center gap-2">
                    <User size={20} className="text-stone-400" />
                    Información básica
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-sm font-medium text-stone-500 mb-1.5 transition-colors group-focus-within:text-stone-900">Nombre</label>
                      <input 
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className={`w-full bg-white border ${errors.nombre ? 'border-red-300' : 'border-stone-200'} rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all placeholder:text-stone-300`}
                        placeholder="Tu nombre completo"
                      />
                      {errors.nombre && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.nombre}</p>}
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-stone-500 mb-1.5 transition-colors group-focus-within:text-stone-900">Empresa o emprendimiento</label>
                      <div className="relative">
                        <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                        <input 
                          type="text"
                          name="empresa"
                          value={formData.empresa}
                          onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                          className={`w-full bg-white border ${errors.empresa ? 'border-red-300' : 'border-stone-200'} rounded-lg pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all placeholder:text-stone-300`}
                          placeholder="Nombre de tu negocio"
                        />
                      </div>
                      {errors.empresa && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.empresa}</p>}
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-stone-500 mb-1.5 transition-colors group-focus-within:text-stone-900">Email</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                        <input 
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className={`w-full bg-white border ${errors.email ? 'border-red-300' : 'border-stone-200'} rounded-lg pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all placeholder:text-stone-300`}
                          placeholder="hola@tuempresa.com"
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.email}</p>}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-medium text-stone-800 flex items-center gap-2">
                    <Briefcase size={20} className="text-stone-400" />
                    Tu Negocio
                  </h3>
                  <div className="group">
                    <label className="block text-sm font-medium text-stone-500 mb-3">¿A qué se dedica tu negocio?</label>
                    <textarea 
                      value={formData.negocio}
                      name="actividad"
                      onChange={(e) => setFormData({...formData, negocio: e.target.value})}
                      rows={4}
                      className={`w-full bg-white border ${errors.negocio ? 'border-red-300' : 'border-stone-200'} rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all placeholder:text-stone-300 resize-none`}
                      placeholder="Ej: Agencia de marketing digital, local de indumentaria, consultora IT..."
                    />
                    {errors.negocio && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.negocio}</p>}
                  </div>
                </div>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-medium text-stone-800">Administración actual</h3>
                  <p className="text-sm text-stone-500">¿Cómo llevás las cuentas hoy?</p>
                  
                  <div className="grid gap-3">
                    {ADMIN_OPTIONS.map((option) => (
                      <label 
                        key={option}
                        className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                          formData.administracionActual === option 
                            ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900' 
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <input 
                          type="radio"
                          name="administracion"
                          value={option}
                          className="hidden"
                          checked={formData.administracionActual === option}
                          onChange={() => setFormData({...formData, administracionActual: option})}
                        />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${
                          formData.administracionActual === option ? 'border-stone-900' : 'border-stone-300'
                        }`}>
                          {formData.administracionActual === option && <div className="w-2 h-2 rounded-full bg-stone-900" />}
                        </div>
                        <span className="text-sm font-medium text-stone-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.administracionActual && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.administracionActual}</p>}

                  <AnimatePresence>
                    {formData.administracionActual === 'Otro' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="group pt-4 space-y-3">
                          <label className="block text-sm font-medium text-stone-500">Contanos qué sistema o método utilizás</label>
                          <textarea 
                            value={formData.otroMetodo}
                            name="administracion_detalle"
                            onChange={(e) => setFormData({...formData, otroMetodo: e.target.value})}
                            rows={3}
                            className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all placeholder:text-stone-300 resize-none"
                            placeholder="Describí brevemente cómo manejás tu administración..."
                          />
                          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Opcional pero recomendado</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.section>
            )}

            {step === 4 && (
              <motion.section
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-medium text-stone-800">Problema principal</h3>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-stone-500">Seleccioná los desafíos que enfrentás:</label>
                    <div className="flex flex-wrap gap-2">
                      {PROBLEMAS_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            console.log("Problema toggled:", option);
                            toggleProblema(option);
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                            formData.problemas.includes(option)
                              ? 'bg-stone-900 text-white border-stone-900 shadow-lg shadow-stone-900/10'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="group pt-4">
                    <label className="block text-sm font-medium text-stone-500 mb-3">Contanos un poco más:</label>
                    <textarea 
                      value={problema}
                      name="problema"
                      onChange={(e) => setProblema(e.target.value)}
                      rows={4}
                      className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all placeholder:text-stone-300 resize-none"
                      placeholder="Describí tu problema principal..."
                    />
                  </div>
                </div>
              </motion.section>
            )}

            {step === 5 && (
              <motion.section
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-medium text-stone-800 flex items-center gap-2">
                    <Target size={20} className="text-stone-400" />
                    Objetivo
                  </h3>
                  <div className="group">
                    <label className="block text-sm font-medium text-stone-500 mb-3">¿Qué te gustaría mejorar primero?</label>
                    <textarea 
                      value={formData.objetivo}
                      name="objetivo"
                      onChange={(e) => setFormData({...formData, objetivo: e.target.value})}
                      rows={4}
                      className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all placeholder:text-stone-300 resize-none"
                      placeholder="Ej: Automatizar mi facturación, tener reportes mensuales de rentabilidad..."
                    />
                  </div>
                </div>
              </motion.section>
            )}

            {step === 6 && (
              <motion.section
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-medium text-stone-800 flex items-start gap-2 leading-tight">
                        <FileUp size={20} className="text-stone-400 mt-1 shrink-0" />
                        ¿Querés adjuntar algún archivo para ayudarnos a entender mejor tu negocio?
                      </h3>
                      <p className="text-sm text-stone-400 font-normal pl-7">
                        (Puede ser un Excel, reporte o cualquier documento útil)
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          console.log("Show file upload: true");
                          setShowFileUpload(true);
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-all ${
                          showFileUpload === true
                            ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900 text-stone-900'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-stone-600'
                        }`}
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log("Show file upload: false");
                          setShowFileUpload(false);
                          removeFile();
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-all ${
                          showFileUpload === false
                            ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900 text-stone-900'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-stone-600'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showFileUpload === true && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden space-y-4"
                      >
                        <div className="space-y-4">
                          <label 
                            htmlFor="archivo-upload"
                            className="block border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center hover:border-stone-400 hover:bg-stone-50/50 transition-all cursor-pointer group"
                          >
                            <input 
                              id="archivo-upload"
                              type="file"
                              name="files"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              className="hidden"
                            />
                            <div className="inline-flex items-center justify-center w-10 h-10 bg-stone-50 text-stone-400 rounded-full mb-3 group-hover:scale-110 transition-transform">
                              <Upload size={20} />
                            </div>
                            <p className="text-sm font-medium text-stone-700">Hacé click para seleccionar un archivo</p>
                            <p className="text-xs text-stone-400 mt-2">Podés adjuntar Excel, balances o documentos (opcional)</p>
                          </label>

                          {archivo && (
                            <div className="flex items-center justify-between p-3 bg-white border border-stone-100 rounded-lg shadow-sm">
                              <div className="flex items-center gap-3">
                                <FileText size={18} className="text-stone-400" />
                                <span className="text-sm text-stone-600 truncate max-w-[200px]">{archivo.name}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={removeFile}
                                className="text-stone-300 hover:text-red-500 transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="pt-8 border-t border-stone-100 flex flex-col gap-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm font-medium"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}
            
            <div className="flex items-center justify-between">
              {step > 1 ? (
                <button
                  key="btn-prev"
                  type="button"
                  onClick={() => {
                    console.log("prevStep called, current step:", step);
                    prevStep();
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 text-stone-400 hover:text-stone-900 font-medium transition-colors disabled:opacity-50"
                >
                  <ChevronLeft size={20} />
                  Anterior
                </button>
              ) : (
                <div />
              )}

              {step < 6 ? (
                <button
                  key="btn-next"
                  type="button"
                  onClick={() => {
                    console.log("nextStep button clicked, current step:", step);
                    nextStep();
                  }}
                  className="flex items-center gap-2 bg-stone-900 text-white px-8 py-4 rounded-full font-medium hover:bg-stone-800 transition-all active:scale-95 shadow-xl shadow-stone-900/10"
                >
                  Siguiente
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  key="btn-submit"
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-stone-900 text-white px-10 py-4 rounded-full font-semibold hover:bg-stone-800 transition-all active:scale-95 shadow-xl shadow-stone-900/10 disabled:bg-stone-400 disabled:scale-100"
                >
                  {loading ? 'Enviando...' : 'Enviar diagnóstico'}
                  {!loading && <CheckCircle2 size={20} />}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Footer Info */}
        <footer className="mt-24 text-center">
          <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">
            © {new Date().getFullYear()} <span translate="no">Gerónimo adm</span> · Consultoría Administrativa
          </p>
        </footer>
      </main>
    </div>
  );
}
