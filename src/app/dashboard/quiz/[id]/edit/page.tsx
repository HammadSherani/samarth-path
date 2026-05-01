"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import axiosInstance from "@/config/axiosInstance";
import { getConfig } from "@/store/slicer";
import Button from "@/components/ui/Button";

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    question: "",
    options: [
      { id: "1", text: "" },
      { id: "2", text: "" },
      { id: "3", text: "" },
      { id: "4", text: "" },
    ],
    correctOptionId: "1",
    explanation: "",
    timerSeconds: 180,
    scheduledDate: "",
    unlocksAt: "14:00",
    isActive: true,
  });

  // ─── Fetch Existing Quiz Data ─────────────────────────────────────────────
  const fetchQuizDetails = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/daily-content/quiz/${id}`, getConfig());
      if (response.data.success) {
        const data = response.data.data;
        const quiz = data.quizContent;

        setFormData({
          title: quiz?.title || "",
          question: quiz?.question || "",
          options: quiz?.options || [
            { id: "1", text: "" },
            { id: "2", text: "" },
            { id: "3", text: "" },
            { id: "4", text: "" },
          ],
          correctOptionId: quiz?.correctOptionId || "1",
          explanation: quiz?.explanation || "",
          timerSeconds: quiz?.timerSeconds || 180,
          scheduledDate: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
          unlocksAt: data.unlocksAt || "14:00",
          isActive: data.isActive,
        });
      }
    } catch (error: any) {
      toast.error("Failed to load quiz details");
      router.push("/dashboard/quiz");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) fetchQuizDetails();
  }, [id, fetchQuizDetails]);

  // ─── Event Handlers ───────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...formData.options];
    updatedOptions[index].text = value;
    setFormData((prev) => ({ ...prev, options: updatedOptions }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (formData.options.some(opt => opt.text.trim() === "")) {
      return toast.error("Please fill all 4 options");
    }

    setUpdating(true);
    try {
      const response = await axiosInstance.put(
        `/daily-content/quiz/${id}`,
        {
            ...formData,
            date: formData.scheduledDate // Backend usually expects 'date' for quiz
        },
        getConfig()
      );

      if (response.data.success) {
        toast.success("Quiz updated successfully!");
        router.push("/dashboard/quiz");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to update quiz";
      toast.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <Icon icon="mdi:arrow-left" className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Quiz</h1>
            <p className="text-sm text-gray-500">Modify your daily quiz question and options.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quiz Title</label>
              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            {/* Question */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question</label>
              <textarea
                required
                name="question"
                rows={3}
                value={formData.question}
                onChange={handleChange}
                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.options.map((option, index) => (
                <div key={option.id}>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Option {option.id}</label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="w-full h-11 px-4 pr-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    {formData.correctOptionId === option.id && (
                      <Icon icon="mdi:check-circle" className="absolute right-3 top-3 text-emerald-500 w-5 h-5" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Correct Choice & Timer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correct Option</label>
                <select
                  name="correctOptionId"
                  value={formData.correctOptionId}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                >
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
                  <option value="3">Option 3</option>
                  <option value="4">Option 4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Timer (Seconds)</label>
                <input
                  required
                  disabled
                  type="number"
                  name="timerSeconds"
                  value={formData.timerSeconds}
                  onChange={handleChange}
                  className="w-full h-11 px-4 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Scheduling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Publish Date</label>
                <input
                  required
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select
                  name="isActive"
                  value={String(formData.isActive)}
                  onChange={(e) => setFormData(p => ({...p, isActive: e.target.value === "true"}))}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Explanation</label>
              <textarea
                name="explanation"
                rows={2}
                value={formData.explanation}
                onChange={handleChange}
                placeholder="Explain the correct answer..."
                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.back()}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={updating}
              icon="mdi:content-save-check"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}