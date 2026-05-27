import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator} from "react-native";
import SubjectCard from "./SubjectCard";
import AskAIChat from "./AskAIChat";
import FadeContainer from "./FadeContainer";
import { COLORS } from "../../utils/theme";

export default function SemesterDetails({ semesterName, subjects, semesterRank, onGenerateAI, aiInsight, aiLoading, gradeLevel,}) {

  const semesterAverage = subjects.length > 0 ? (subjects.reduce((sum, s) => sum + s.percentage, 0 ) / subjects.length) : 0;
  const isKindergarten = ( level ) => {
    if (!level) return false;
    return /^(kg|nursery|pre)/i.test(level);
  };

  const renderList = ( items, color ) => {
    return items?.map(
      (item, index) => (
        <View
          key={index}
          className="flex-row mb-2"
        >
          <Text style={{ color }}> • </Text>
          <Text
            className="ml-2 flex-1 text-sm"
            style={{ color }}
          >
            {item}
          </Text>
        </View>
      )
    );

  };

  return (
    <View className="gap-5">
      {/* HEADER */}
      <View
        className="bg-white rounded-3xl p-5"
        style={{ borderWidth: 1, borderColor: COLORS.border }}
      >
        <Text
          className="text-2xl font-bold"
          style={{ color: COLORS.textPrimary }}
        >
          {semesterName}
        </Text>

        <Text className="mt-1" style={{ color: COLORS.textSecondary}}>
          Semester academic performance details
        </Text>

        {/* SUMMARY */}
        <View className="flex-row gap-3 mt-5">
          {/* AVERAGE */}
          <View
            className="flex-1 rounded-2xl p-4"
            style={{
              backgroundColor:
                "#fdf2f8",
            }}
          >

            <Text
              className="text-xs font-bold uppercase"
              style={{
                color: "#be185d",
              }}
            >
              Semester Average
            </Text>

            <Text
              className="text-2xl font-bold mt-2"
              style={{
                color: "#9d174d",
              }}
            >
              {semesterAverage.toFixed(1)}%
            </Text>

          </View>

          {/* RANK */}

          {!isKindergarten(
            gradeLevel
          ) && (

            <View
              className="flex-1 rounded-2xl p-4"
              style={{
                backgroundColor:
                  "#eef2ff",
              }}
            >

              <Text
                className="text-xs font-bold uppercase"
                style={{
                  color: "#4f46e5",
                }}
              >
                Semester Rank
              </Text>

              <Text
                className="text-2xl font-bold mt-2"
                style={{
                  color: "#4338ca",
                }}
              >
                {semesterRank || "-"}
              </Text>

            </View>
          )}

        </View>

      </View>

      {/* AI INSIGHT */}

      <View
        className="bg-white rounded-3xl p-5"
        style={{
          borderWidth: 1,
          borderColor:
            COLORS.border,
        }}
      >

        <Text
          className="text-xl font-bold"
          style={{
            color:
              COLORS.textPrimary,
          }}
        >
          ✨ AI Performance Insight
        </Text>

        <Text
          className="mt-1 text-sm"
          style={{
            color:
              COLORS.textSecondary,
          }}
        >
          Personalized analysis
          of performance
        </Text>

        {/* BUTTON */}

        <TouchableOpacity
          className="rounded-2xl p-4 items-center mt-5"
          style={{
            backgroundColor:
              aiInsight
                ? "#eef2ff"
                : COLORS.primary,
          }}
          onPress={() =>
            onGenerateAI(
              !!aiInsight
            )
          }
          disabled={aiLoading}
        >

          {aiLoading ? (<ActivityIndicator color={ aiInsight ? "#4338ca" : "white"} />)
             : (
            <Text
              className="font-bold"
              style={{ color: aiInsight ? "#4338ca" : "white",
              }}
            >
              {aiInsight
                ? "🔄 Regenerate"
                : "Generate AI Insight"}
            </Text>
          )}
        </TouchableOpacity>

        {/* LOADING */}

        {aiLoading && (
          <View className="mt-6">
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />
          </View>
        )}

        {/* AI RESULTS */}
        {aiInsight &&
          !aiLoading && (
          <FadeContainer>
            <View className="mt-6 gap-5">
              {/* SUMMARY */}
              <View
                className="rounded-2xl p-4"
                style={{
                  backgroundColor:
                    "#f8fafc",
                }}
              >
                <Text
                  className="italic"
                  style={{
                    color:
                      COLORS.textPrimary,
                  }}
                >
                  "{aiInsight.summary}"
                </Text>
              </View>

              {/* STRENGTHS */}
              <View
                className="rounded-2xl p-5"
                style={{
                  backgroundColor:
                    "#ecfdf5",
                }}
              >
                <Text
                  className="font-bold mb-3"
                  style={{
                    color: "#065f46",
                  }}
                >
                  Core Strengths
                </Text>

                {renderList(
                  aiInsight.strengths,
                  "#047857"
                )}
              </View>

              {/* WEAKNESSES */}
              <View
                className="rounded-2xl p-5"
                style={{
                  backgroundColor:
                    "#fff7ed",
                }}
              >

                <Text
                  className="font-bold mb-3"
                  style={{
                    color: "#9a3412",
                  }}
                >
                  Areas to Focus
                </Text>

                {renderList(
                  aiInsight.weaknesses,
                  "#c2410c"
                )}

              </View>

              {/* RECOMMENDATIONS */}

              <View
                className="rounded-2xl p-5"
                style={{
                  backgroundColor:
                    "#eff6ff",
                }}
              >

                <Text
                  className="font-bold mb-3"
                  style={{
                    color: "#1d4ed8",
                  }}
                >
                  Recommendations
                </Text>

                {renderList(
                  aiInsight.recommendations,
                  "#2563eb"
                )}

              </View>

              {/* PARENT GUIDANCE */}

              <View
                className="rounded-2xl p-5"
                style={{
                  backgroundColor:
                    "#faf5ff",
                }}
              >

                <Text
                  className="font-bold mb-3"
                  style={{
                    color: "#7e22ce",
                  }}
                >
                  Home Guidance
                </Text>

                <Text
                  style={{
                    color: "#6b21a8",
                  }}
                >
                  {
                    aiInsight.parentGuidance
                  }
                </Text>

              </View>

              {/* CHAT */}

              <AskAIChat
                semesterName={
                  semesterName
                }
                subjects={subjects}
              />
            </View>
          </FadeContainer>
        )}
      </View>

      {/* SUBJECTS */}

      <View className="gap-4">
        {subjects.map(subject => (
          <SubjectCard 
            key={subject.id}
            subject={subject}
          />
        ))}
      </View>
    </View>
  );
}