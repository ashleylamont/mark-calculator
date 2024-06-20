<script setup lang="ts">
import { computed, ref, Ref, watch } from 'vue'
import type { IAssessment, IGrade } from './types.ts'
import MarkDiagram from './components/MarkDiagram.vue'
import { useMagicKeys } from '@vueuse/core'
import purplePrint from './assets/print.png'

const grades: Ref<IGrade[]> = ref<IGrade[]>([
  {
    minMark: 0,
    name: 'Fail',
    abbreviation: 'N'
  },
  {
    minMark: 45,
    name: 'Supplemental Pass',
    abbreviation: 'PX'
  },
  {
    minMark: 50,
    name: 'Pass',
    abbreviation: 'P'
  },
  {
    minMark: 60,
    name: 'Credit',
    abbreviation: 'CR'
  },
  {
    minMark: 70,
    name: 'Distinction',
    abbreviation: 'D'
  },
  {
    minMark: 80,
    name: 'High Distinction',
    abbreviation: 'HD'
  }
])

const assessments: Ref<IAssessment[]> = ref<IAssessment[]>([
  {
    name: 'Assignment 1',
    weight: 20,
    mark: 0,
    markKnown: false
  },
  {
    name: 'Assignment 2',
    weight: 30,
    mark: 0,
    markKnown: false
  },
  {
    name: 'Final Exam',
    weight: 50,
    mark: 0,
    markKnown: false
  }
])

const normaliseWeights: Ref<boolean> = ref<boolean>(true)

const normalisedWeights = computed<number[]>(() => {
  if (!normaliseWeights.value) {
    return assessments.value.map(v => v.weight / 100)
  }

  const totalWeight = Math.max(1, assessments.value.map(v => v.weight).reduce((a, b) => a + b, 0))
  return assessments.value.map(v => v.weight / totalWeight)
})

const shouldProjectMarks = ref(false)
const projectedMark = ref(0)

const keys = useMagicKeys()
const purple = keys['P+U+R+L+E']

watch(purple, (v) => {
  if (v) {
    console.log('Purple magic key pressed!')
    document.body.style.backgroundImage = `url(${purplePrint})`
    document.body.style.backgroundSize = '800px'
    document.body.style.backgroundRepeat = 'repeat'
  }
})
</script>

<template>
  <v-container style="background: rgba(255, 255, 255, 0.9)">
    <h2 class="text-h2 mb-2">
      Mark Calculator
    </h2>
    <v-data-table
      :headers="[{
                   key: 'name',
                   title: 'Assessment Name',
                   align: 'start'
                 },
                 {
                   key: 'weight',
                   title: 'Weight',
                   align: 'start',
                   width: '100px'
                 },
                 {
                   key: 'mark',
                   title: 'Mark (Out of 100)',
                   align: 'start'
                 },
                 {
                   key: 'markKnown',
                   title: 'Is Mark Known',
                   align: 'start',
                   width: '150px'
                 },
                 {
                   key: 'actions',
                   title: 'Actions',
                   align: 'start',
                   sortable: false,
                   width: '80px'
                 }]"
      :items="assessments"
    >
      <template #top>
        <v-toolbar
          flat
        >
          <v-toolbar-title>Assessments</v-toolbar-title>
          <v-divider
            class="mx-4"
            inset
            vertical
          />
          <v-spacer />
          <v-btn
            color="primary"
            @click="assessments.push({name: 'New Assessment', weight: 0, mark: 0, markKnown: false})"
          >
            New Item
          </v-btn>
        </v-toolbar>
      </template>
      <template #[`item.weight`]="{ item }">
        {{ item.weight }}
        <span v-if="normaliseWeights">({{
          Math.round(item.weight / Math.max(1, assessments.map(v => v.weight).reduce((a, b) => a + b, 0)) * 100)
        }}%)</span>
      </template>
      <template #[`item.mark`]="{item}">
        <v-row
          align="center"
          justify="center"
        >
          <v-col>
            <v-slider
              v-model.number="item.mark"
              hide-details
              min="0"
              max="100"
              step="1"
            />
          </v-col>
          <v-col style="max-width: 80px">
            <v-text-field
              v-model.number="item.mark"
              hide-details
              type="number"
              min="0"
              max="100"
              variant="underlined"
            />
          </v-col>
        </v-row>
      </template>
      <template #[`item.markKnown`]="{ item }">
        <v-checkbox
          v-model="item.markKnown"
          :true-value="true"
          :false-value="false"
          hide-details
        />
      </template>
      <template #[`item.actions`]="{ item }">
        <v-dialog max-width="500px">
          <template #activator="{ props: activatorProps }">
            <v-icon
              v-bind="activatorProps"
              class="me-2"
              size="small"
            >
              mdi-pencil
            </v-icon>
          </template>
          <template #default="{ isActive }">
            <v-card title="Dialog">
              <v-card-title>
                Edit Assessment
              </v-card-title>
              <v-card-text>
                <v-text-field
                  v-model="item.name"
                  label="Assessment Name"
                />
                <v-text-field
                  v-model.number="item.weight"
                  label="Weight"
                  type="number"
                />
                <v-text-field
                  v-model.number="item.mark"
                  label="Mark"
                  type="number"
                />
                <v-checkbox
                  v-model="item.markKnown"
                  label="Is Mark Known"
                  :true-value="true"
                  :false-value="false"
                />
              </v-card-text>

              <v-card-actions>
                <v-spacer />

                <v-btn
                  text="Close Dialog"
                  @click="isActive.value = false"
                />
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
        <v-icon
          size="small"
          @click="assessments.splice(assessments.indexOf(item), 1)"
        >
          mdi-delete
        </v-icon>
      </template>
    </v-data-table>
    <v-checkbox
      v-model="normaliseWeights"
      label="Normalise Weights"
      :true-value="true"
      :false-value="false"
    />
    <v-checkbox
      v-model="shouldProjectMarks"
      label="Project Unknown Marks"
      :true-value="true"
      :false-value="false"
    />
    <v-slider
      v-model.number="projectedMark"
      label="Projected Mark"
      :disabled="!shouldProjectMarks"
      min="0"
      max="100"
      step="1"
    >
      <template #append>
        <v-text-field
          v-model.number="projectedMark"
          hide-details
          type="number"
          min="0"
          max="100"
          variant="underlined"
        />
      </template>
    </v-slider>
    <mark-diagram
      :assessments="assessments"
      :grades="grades"
      :normalised-weights="normalisedWeights"
      :projected-mark="shouldProjectMarks ? projectedMark : undefined"
    />
  </v-container>
</template>

<style scoped>
</style>
