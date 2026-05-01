"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import axiosInstance from "@/config/axiosInstance";
import { getConfig } from "@/store/slicer";
import Button from "@/components/ui/Button";

export default function AddQuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    date: new Date().toISOString().split("T")[0],
    unlocksAt: "14:00",
  });

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

    if (formData.options.some((opt) => opt.text.trim() === "")) {
      return toast.error("Please fill all 4 options");
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/daily-content/quiz",
        formData,
        getConfig()
      );

      if (response.data.success) {
        toast.success("Quiz Scheduled Successfully!");
        router.push("/dashboard/quiz");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to schedule quiz";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <Icon icon="mdi:arrow-left" className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Daily Quiz</h1>
            <p className="text-sm text-gray-500">Create a question with 4 options.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quiz Title</label>
              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Daily GK Quiz"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question</label>
              <textarea
                required
                name="question"
                rows={3}
                value={formData.question}
                onChange={handleChange}
                placeholder="Enter the quiz question here..."
                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
              />
            </div>

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
                      placeholder={`Choice ${option.id}`}
                      className="w-full h-11 px-4 pr-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                    {formData.correctOptionId === option.id && (
                      <Icon icon="mdi:check-circle" className="absolute right-3 top-3 text-emerald-500 w-5 h-5" />
                    )}
                  </div>
                </div>
              ))}
            </div>

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
                  className="w-full h-11 px-4 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Publish Date</label>
                <input
                  required
                  type="date"
                  name="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unlock Time</label>
                <input
                  required
                  type="time"
                  disabled
                  name="unlocksAt"
                  value={formData.unlocksAt}
                  onChange={handleChange}
                  className="w-full disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Explanation</label>
              <textarea
                name="explanation"
                rows={2}
                value={formData.explanation}
                onChange={handleChange}
                placeholder="Explain why the answer is correct..."
                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              icon="mdi:send-clock"
            >
              Schedule Quiz
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}