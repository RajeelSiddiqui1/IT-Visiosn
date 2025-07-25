import React, { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateCV, updateCV } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import { motion } from "framer-motion";
import { PlusCircle, Trash2 } from "lucide-react";

const CVForm = ({ initialData = null, onClose, onSuccess }) => {
  const { authUser, isLoading: authLoading } = useAuthUser();

  const [form, setForm] = useState({
    userId: authUser?.userId || authUser?._id || "",
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    skills: [""],
    experience: [{ company: "", role: "", duration: "", description: "" }],
    education: [{ institution: "", degree: "", year: "" }],
    certifications: [{ name: "", issuer: "", year: "" }],
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        _id: initialData._id,
        ...initialData,
        userId: initialData.userId || authUser?.userId || authUser?._id || "",
      });
    }
  }, [initialData, authUser]);

  const handleChange = (section, index, key, value) => {
    if (Array.isArray(form[section])) {
      const updated = [...form[section]];
      updated[index][key] = value;
      setForm({ ...form, [section]: updated });
    } else {
      setForm({ ...form, [key]: value });
    }
  };

  const addEntry = (section) => {
    setForm({
      ...form,
      [section]: [
        ...form[section],
        section === "skills"
          ? ""
          : section === "experience"
          ? { company: "", role: "", duration: "", description: "" }
          : section === "education"
          ? { institution: "", degree: "", year: "" }
          : { name: "", issuer: "", year: "" },
      ],
    });
  };

  const removeEntry = (section, index) => {
    if (form[section].length > 1) {
      setForm({
        ...form,
        [section]: form[section].filter((_, i) => i !== index),
      });
    }
  };

  const generateMutation = useMutation({
    mutationFn: generateCV,
    onSuccess: () => {
      onSuccess?.();
      onClose?.();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCV,
    onSuccess: () => {
      onSuccess?.();
      onClose?.();
    },
  });

  const handleSubmit = () => {
    const mutation = initialData ? updateMutation : generateMutation;
    mutation.mutate(form);
  };

  if (authLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card bg-base-100 shadow-xl max-w-4xl mx-auto max-h-[85vh] overflow-y-auto"
    >
      <div className="card-body p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="card-title text-3xl">
            {initialData ? "Edit CV" : "Create Professional CV"}
          </h1>
          <div className="badge badge-primary badge-lg">AI Powered</div>
        </div>

        {/* Basic Information */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <div className="badge badge-outline">Required</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["name", "email", "phone", "linkedin"].map((field) => (
              <div key={field} className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </span>
                </label>
                <input
                  type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                  placeholder={
                    field === "email" ? "john@example.com" :
                    field === "phone" ? "+1 (555) 123-4567" :
                    field === "linkedin" ? "https://linkedin.com/in/username" :
                    "John Doe"
                  }
                  className="input input-bordered w-full"
                  value={form[field]}
                  onChange={(e) => handleChange(null, null, field, e.target.value)}
                  required={field !== "linkedin"}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Skills Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Technical Skills</h2>
              <div className="badge badge-secondary">Highlight your expertise</div>
            </div>
            <button
              onClick={() => addEntry("skills")}
              className="btn btn-outline btn-sm gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Skill
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {form.skills.map((skill, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input input-bordered flex-1"
                  type="text"
                  value={skill}
                  onChange={(e) => {
                    const updated = [...form.skills];
                    updated[i] = e.target.value;
                    setForm({ ...form, skills: updated });
                  }}
                  placeholder={`e.g., React, Node.js, Python`}
                />
                {form.skills.length > 1 && (
                  <button
                    onClick={() => removeEntry("skills", i)}
                    className="btn btn-ghost btn-sm text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Experience Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Professional Experience</h2>
              <div className="badge badge-accent">Career highlights</div>
            </div>
            <button
              onClick={() => addEntry("experience")}
              className="btn btn-outline btn-sm gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Experience
            </button>
          </div>
          {form.experience.map((exp, i) => (
            <div key={i} className="card bg-base-200 mb-4">
              <div className="card-body p-6 relative">
                {form.experience.length > 1 && (
                  <button
                    onClick={() => removeEntry("experience", i)}
                    className="btn btn-ghost btn-sm btn-circle absolute top-2 right-2 text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Company</span>
                    </label>
                    <input
                      className="input input-bordered"
                      placeholder="Google Inc."
                      value={exp.company}
                      onChange={(e) =>
                        handleChange("experience", i, "company", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Role</span>
                    </label>
                    <input
                      className="input input-bordered"
                      placeholder="Senior Software Engineer"
                      value={exp.role}
                      onChange={(e) =>
                        handleChange("experience", i, "role", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Duration</span>
                    </label>
                    <input
                      className="input input-bordered"
                      placeholder="Jan 2020 - Present"
                      value={exp.duration}
                      onChange={(e) =>
                        handleChange("experience", i, "duration", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Key Achievements & Responsibilities</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="• Led a team of 5 developers to build scalable web applications&#10;• Improved system performance by 40% through optimization&#10;• Implemented CI/CD pipelines reducing deployment time by 60%"
                    value={exp.description}
                    onChange={(e) =>
                      handleChange("experience", i, "description", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Education Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Education</h2>
              <div className="badge badge-info">Academic background</div>
            </div>
            <button
              onClick={() => addEntry("education")}
              className="btn btn-outline btn-sm gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Education
            </button>
          </div>
          {form.education.map((edu, i) => (
            <div key={i} className="card bg-base-200 mb-4">
              <div className="card-body p-6 relative">
                {form.education.length > 1 && (
                  <button
                    onClick={() => removeEntry("education", i)}
                    className="btn btn-ghost btn-sm btn-circle absolute top-2 right-2 text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Institution</span>
                    </label>
                    <input
                      className="input input-bordered"
                      placeholder="Stanford University"
                      value={edu.institution}
                      onChange={(e) =>
                        handleChange("education", i, "institution", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Degree</span>
                    </label>
                    <input
                      className="input input-bordered"
                      placeholder="Bachelor of Computer Science"
                      value={edu.degree}
                      onChange={(e) =>
                        handleChange("education", i, "degree", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Year</span>
                    </label>
                    <input
                      className="input input-bordered"
                      placeholder="2018-2022"
                      value={edu.year}
                      onChange={(e) =>
                        handleChange("education", i, "year", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Certifications Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Certifications</h2>
              <div className="badge badge-success">Professional credentials</div>
            </div>
            <button
              onClick={() => addEntry("certifications")}
              className="btn btn-outline btn-sm gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Certification
            </button>
          </div>
          {form.certifications.map((cert, i) => (
            <div key={i} className="card bg-base-200 mb-4">
              <div className="card-body p-6 relative">
                {form.certifications.length > 1 && (
                  <button
                    onClick={() => removeEntry("certifications", i)}
                    className="btn btn-ghost btn-sm btn-circle absolute top-2 right-2 text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Certification Name</span>
                    </label>
                    <input
                      className="input input-bordered"
                      placeholder="AWS Solutions Architect"
                      value={cert.name}
                      onChange={(e) =>
                        handleChange("certifications", i, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Issuing Organization</span>
                    </label>
                    <input
                      className="input input-bordered"
                      placeholder="Amazon Web Services"
                      value={cert.issuer}
                      onChange={(e) =>
                        handleChange("certifications", i, "issuer", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Year Obtained</span>
                    </label>
                    <input
                      className="input input-bordered"
                      placeholder="2023"
                      value={cert.year}
                      onChange={(e) =>
                        handleChange("certifications", i, "year", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="card-actions justify-end pt-6 border-t">
          <button
            onClick={onClose}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={generateMutation.isPending || updateMutation.isPending}
            className="btn btn-primary gap-2"
          >
            {generateMutation.isPending || updateMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                AI is crafting your CV...
              </>
            ) : (
              <>
                {initialData ? "Update CV" : "Generate Professional CV"}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CVForm;