import React from "react";
import { View, Text} from "react-native";
import { COLORS } from "../../utils/theme";

export default function SubjectCard({ subject}) {

  return (
    <View
      className="bg-white rounded-3xl overflow-hidden"
      style={{ borderWidth: 1, borderColor: COLORS.border}}
    >

      {/* HEADER */}
      <View
        className="px-5 py-5 flex-row items-center justify-between"
        style={{
          borderBottomWidth: 1,
          borderBottomColor:
            COLORS.border,
        }}
      >

        <View className="flex-1 pr-4">

          <Text

            className="text-xl font-bold"

            style={{
              color:
                COLORS.textPrimary,
            }}
          >
            {subject.subjectName}
          </Text>

          <Text

            className="mt-1 text-sm"

            style={{
              color:
                COLORS.textSecondary,
            }}
          >
            Subject assessment
            breakdown
          </Text>

        </View>

        <View>

          <Text
            className="font-semibold"
            style={{
              color:
                COLORS.textSecondary,
            }}
          >
            {subject.score}/{subject.totalMarks}
          </Text>
        </View>
      </View>

      {/* BODY */}
      <View className="p-5 gap-6">
        {Object.entries(
          subject.groupedByMonth || {}
        ).map(
          ([month, assessments]) => (
            <View key={month}>

              {/* MONTH */}
              <View className="flex-row items-center justify-between mb-4">
                <Text
                  className="text-sm font-bold uppercase"
                  style={{
                    color:
                      COLORS.primary,
                  }}
                >
                  {month}
                </Text>

                <View

                  className="px-3 py-1 rounded-xl"

                  style={{
                    backgroundColor:
                      "#fce7f3",
                  }}
                >

                  <Text

                    className="text-xs font-bold"

                    style={{
                      color:
                        COLORS.primary,
                    }}
                  >
                    {
                      assessments.length
                    } Assessments
                  </Text>

                </View>

              </View>

              {/* ASSESSMENTS */}

              <View className="gap-3">

                {assessments.map(
                  (assessment) => (

                    <View

                      key={
                        assessment.id
                      }

                      className="rounded-2xl p-4 flex-row items-center justify-between"

                      style={{
                        backgroundColor:
                          "#f8fafc",

                        borderWidth: 1,

                        borderColor:
                          COLORS.border,
                      }}
                    >

                      <View className="flex-1 pr-4">

                        <Text

                          className="font-bold"

                          style={{
                            color:
                              COLORS.textPrimary,
                          }}
                        >
                          {
                            assessment.name
                          }
                        </Text>

                        <Text

                          className="text-xs mt-1"

                          style={{
                            color:
                              COLORS.textSecondary,
                          }}
                        >
                          Assessment
                        </Text>

                      </View>

                      <View>

                        <Text

                          className="text-lg font-bold"

                          style={{
                            color:
                              COLORS.textPrimary,
                          }}
                        >
                          {
                            assessment.score
                          }
                          /
                          {
                            assessment.totalMarks
                          }
                        </Text>

                      </View>

                    </View>
                  )
                )}

              </View>

            </View>
          )
        )}

      </View>

      {/* FOOTER */}

      <View className="px-5 pb-5">

        <View className="flex-row items-center justify-between mb-3">

          <Text

            className="font-semibold"

            style={{
              color:
                COLORS.textSecondary,
            }}
          >
            Performance
          </Text>

          <Text

            className="font-bold"

            style={{
              color:
                COLORS.textPrimary,
            }}
          >
            {subject.percentage?.toFixed(1)}%
          </Text>

        </View>

        {/* PROGRESS BAR */}

        <View

          className="h-3 rounded-full overflow-hidden"

          style={{
            backgroundColor:
              "#e2e8f0",
          }}
        >

          <View

            className="h-full rounded-full"

            style={{
              width:
                `${subject.percentage}%`,

              backgroundColor:
                COLORS.primary,
            }}
          />

        </View>

      </View>

    </View>
  );
}