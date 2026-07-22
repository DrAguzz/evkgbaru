import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Bike, CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/become-a-rider")({
  component: BecomeRider,
  head: () => ({
    meta: [
      { title: "Become a Rider · EV Kg Baru" },
      {
        name: "description",
        content:
          "Join EV Kg Baru as an EV Motorcycle tour rider. Apply full-time or part-time — full application form for review.",
      },
      { property: "og:title", content: "Become a Rider · EV Kg Baru" },
      {
        property: "og:description",
        content: "Apply to become an EV tour rider with EV Kg Baru in Kuala Lumpur.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

interface Hub {
  id: string;
  name: string;
}

const LANG_OPTIONS = ["English", "Bahasa Malaysia", "Mandarin", "Tamil", "Arabic", "Japanese", "Korean"];

function BecomeRider() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    ic_passport: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    address: "",
    license_number: "",
    driving_experience_years: 0,
    employment_type: "full_time" as "full_time" | "part_time",
    hub_id: "",
  });
  const [languages, setLanguages] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [declaration, setDeclaration] = useState(false);

  useEffect(() => {
    void supabase
      .from("hubs")
      .select("id, name")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => setHubs((data ?? []) as Hub[]));
  }, []);

  function toggleLang(l: string) {
    setLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  }

  async function uploadIf(file: File | null, prefix: string): Promise<string | null> {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) throw new Error("File must be under 5MB");
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `rider-applications/${prefix}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("app-assets").upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("app-assets").getPublicUrl(path);
    return data.publicUrl;
  }

  async function submit() {
    if (!declaration) return toast.error("You must accept the declaration");
    if (!form.full_name || !form.email || !form.phone || !form.ic_passport)
      return toast.error("Please fill all required fields");
    setBusy(true);
    try {
      const [photo_url, resume_url] = await Promise.all([uploadIf(photoFile, "photo"), uploadIf(resumeFile, "resume")]);
      const { error } = await supabase.from("rider_applications").insert({
        full_name: form.full_name,
        ic_passport: form.ic_passport,
        phone: form.phone,
        email: form.email,
        dob: form.dob || null,
        gender: form.gender || null,
        address: form.address || null,
        license_number: form.license_number || null,
        driving_experience_years: Number(form.driving_experience_years) || 0,
        languages,
        employment_type: form.employment_type,
        hub_id: form.hub_id || null,
        photo_url,
        resume_url,
        documents: [],
        declaration_accepted_at: new Date().toISOString(),
        status: "submitted",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 grid place-items-center px-4 py-16">
          <div className="max-w-md w-full text-center bg-card rounded-3xl shadow-card p-10">
            <div className="grid place-items-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">Application received</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Thanks {form.full_name}! Our team will review your application and contact you for an interview.
            </p>
            <Button className="mt-6 rounded-full" asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="text-center mb-8">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground mx-auto mb-3">
            <Bike className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold">Become a Rider</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Join our EV Motorcycle tourism team. Submit your application and we&apos;ll be in touch.
          </p>
        </div>

        <Card className="rounded-2xl border-0 shadow-card">
          <CardContent className="p-6 space-y-5">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Personal Info</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div>
                  <Label>IC / Passport *</Label>
                  <Input
                    value={form.ic_passport}
                    onChange={(e) => setForm({ ...form, ic_passport: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Driving</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Driving License Number</Label>
                  <Input
                    value={form.license_number}
                    onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Driving Experience (years)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.driving_experience_years}
                    onChange={(e) =>
                      setForm({ ...form, driving_experience_years: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Languages Spoken</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {LANG_OPTIONS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggleLang(l)}
                      className={`px-3 py-1.5 rounded-full text-sm border ${
                        languages.includes(l)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Employment</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Employment Type *</Label>
                  <Select
                    value={form.employment_type}
                    onValueChange={(v) =>
                      setForm({ ...form, employment_type: v as "full_time" | "part_time" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preferred Hub</Label>
                  <Select value={form.hub_id} onValueChange={(v) => setForm({ ...form, hub_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hub" />
                    </SelectTrigger>
                    <SelectContent>
                      {hubs.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Uploads</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                  <Upload className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Profile Photo</div>
                    <div className="text-xs text-muted-foreground">
                      {photoFile ? photoFile.name : "Optional · max 5MB"}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                  <Upload className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Resume</div>
                    <div className="text-xs text-muted-foreground">
                      {resumeFile ? resumeFile.name : "Optional · max 5MB"}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <label className="flex items-start gap-3">
                <Checkbox checked={declaration} onCheckedChange={(v) => setDeclaration(!!v)} />
                <span className="text-sm text-muted-foreground">
                  I declare that all information provided is true and complete. I understand that submitting this form
                  does not guarantee employment, and that I will be contacted for an interview.
                </span>
              </label>
            </section>

            <Button className="w-full rounded-full h-12 text-base" disabled={busy} onClick={submit}>
              {busy ? "Submitting…" : "Submit Application"}
            </Button>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
