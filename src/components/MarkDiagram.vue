<script setup lang="ts">
import { IAssessment, IGrade } from '../types.ts'
import { computed, ref, toRefs } from 'vue'
import { useElementSize } from '@vueuse/core'

const props = defineProps<{
  assessments: IAssessment[],
  grades: IGrade[],
  normalisedWeights: number[],
  projectedMark?: number
}>()

const { assessments, normalisedWeights, grades, projectedMark } = toRefs(props)

const containerDiv = ref<HTMLDivElement | null>(null)
const width = useElementSize(containerDiv).width

const assessmentBars = computed<{ x: number, width: number, assessment: IAssessment }[]>(() => {
  return assessments.value.map((assessment, index) => {
    const start = normalisedWeights.value.slice(0, index).reduce((acc, val) => acc + val, 0)
    const weight = normalisedWeights.value[index]
    return {
      x: start * width.value,
      width: weight * width.value,
      assessment
    }
  })
})

type INormalisedAssessment = IAssessment & { normalisedWeight: number }
const markSum = computed<{
  assessment: INormalisedAssessment,
  x: number,
  width: number
}[]>(() => {
  const knownAssessments = assessments.value.map((v, i) => ({
    ...v,
    index: i
  })).filter(assessment => assessment.markKnown)
  const unknownAssessments = assessments.value.map((v, i) => ({
    ...v,
    index: i
  })).filter(assessment => !assessment.markKnown)
  const orderedAssessments = [...knownAssessments, ...unknownAssessments].map((v) => ({
    ...v,
    normalisedWeight: normalisedWeights.value[v.index],
    mark: v.markKnown ? v.mark : (projectedMark?.value ?? 0),
    markKnown: v.markKnown || projectedMark.value !== undefined
  }))
  const result: {
    assessment: INormalisedAssessment
    x: number,
    width: number,
  }[] = []
  for (const assessment of orderedAssessments) {
    const start = result.reduce((acc, val) => acc + val.width, 0)
    const markWidth = assessment.normalisedWeight * (assessment.markKnown ? assessment.mark / 100 : 1) * width.value
    result.push({
      assessment,
      x: start,
      width: markWidth
    })
  }
  return result
})
</script>

<template>
  <div ref="containerDiv">
    <svg
      :width="width"
      height="250"
    >
      <!-- Assessments bar -->
      <g
        v-for="(bar, index) in assessmentBars"
        :key="index"
      >
        <rect
          :x="bar.x"
          y="0"
          :width="bar.width"
          height="50"
          :fill="`hsl(${(bar.x + (bar.width)/2)/width*360}, 70%, 60%)`"
        />
        <text
          :x="bar.x + bar.width/2"
          y="25"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="black"
        >
          {{ bar.assessment.name }} ({{ Math.round(bar.assessment.weight) }}%)
        </text>
      </g>
      <!-- Per-assessment marks -->
      <g
        v-for="(bar, index) in assessmentBars"
        :key="index"
      >
        <g v-if="bar.assessment.markKnown">
          <rect
            :x="bar.x"
            y="50"
            :width="bar.width * bar.assessment.mark / 100"
            height="50"
            :fill="`hsl(${(bar.x + (bar.width)/2)/width*360}, 70%, 80%)`"
          />
          <rect
            :x="bar.x + bar.width * bar.assessment.mark / 100"
            y="50"
            :width="bar.width * (1 - bar.assessment.mark / 100)"
            height="50"
            :fill="`hsl(${(bar.x + (bar.width)/2)/width*360}, 70%, 90%)`"
          />
          <text
            :x="bar.x + bar.width/2"
            y="75"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="black"
          >
            {{ bar.assessment.mark }}%
          </text>
        </g>
        <g v-else>
          <rect
            :x="bar.x"
            y="50"
            :width="bar.width"
            height="50"
            fill="lightgrey"
          />
          <text
            :x="bar.x + bar.width/2"
            y="75"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="black"
          >
            ?
          </text>
        </g>
      </g>
      <!-- Total marks -->
      <g
        v-for="(bar, index) in markSum"
        :key="index"
      >
        <g v-if="bar.assessment?.markKnown">
          <rect
            :x="bar.x"
            y="100"
            :width="bar.width"
            height="100"
            :fill="`hsl(${(bar.x + (bar.width)/2)/width*360}, 70%, 80%)`"
          />
          <text
            :x="bar.x + bar.width/2"
            y="125"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="black"
          >
            {{ Math.round(bar.assessment.mark * bar.assessment.normalisedWeight * 10) / 10 }}%
          </text>
          <text
            :x="bar.x + bar.width/2"
            y="175"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="black"
          >
            {{ bar.assessment.name.split(' ').map(v => v[0].toUpperCase()).join('') }}
          </text>
        </g>
        <g v-else>
          <rect
            :x="bar.x"
            y="100"
            :width="bar.width"
            height="100"
            fill="lightgrey"
          />
          <text
            :x="bar.x + bar.width/2"
            y="125"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="black"
          >
            ?
          </text>
          <text
            :x="bar.x + bar.width/2"
            y="175"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="black"
          >
            {{ bar.assessment.name.split(' ').map(v => v[0].toUpperCase()).join('') }}
          </text>
        </g>
      </g>
      <g>
        <rect
          :x="(markSum.at(-1)?.x??0) + (markSum.at(-1)?.width??0)"
          y="100"
          :width="width - ((markSum.at(-1)?.x??0) + (markSum.at(-1)?.width??0))"
          height="100"
          fill="black"
        />
        <text
          :x="(markSum.at(-1)?.x??0) + (markSum.at(-1)?.width??0) + (width - ((markSum.at(-1)?.x??0) + (markSum.at(-1)?.width??0)))/2"
          y="125"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="white"
        >
          {{ Math.round(markSum.filter(x=>x.assessment.markKnown).reduce((acc, val) => acc + (1-(val.assessment.mark/100)) * val.assessment.normalisedWeight, 0) * 1000) / 10 }}%
        </text>
        <text
          :x="(markSum.at(-1)?.x??0) + (markSum.at(-1)?.width??0) + (width - ((markSum.at(-1)?.x??0) + (markSum.at(-1)?.width??0)))/2"
          y="175"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="white"
        >
          Missed marks
        </text>

        <g />
      </g>
      <!-- Grade boundaries -->
      <g
        v-for="(grade, index) in grades"
        :key="index"
      >
        <rect
          :x="grade.minMark/100 * width"
          y="200"
          :width="((index === grades.length - 1 ? 1 : grades[index+1].minMark/100) - grade.minMark/100) * width"
          height="50"
          :fill="`hsl(${(grade.minMark/100 + ((index === grades.length - 1 ? 1 : grades[index+1].minMark/100) - grade.minMark/100)/2)*230}, 70%, 60%)`"
        />
        <text
          :x="grade.minMark/100 * width + ((index === grades.length - 1 ? 1 : grades[index+1].minMark/100) - grade.minMark/100) * width/2"
          y="225"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="black"
        >
          {{ grade.abbreviation }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>

</style>
