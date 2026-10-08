/**
 * @file PipelineSteps.tsx
 * @description Các bước xử lý của một tính năng AI, đánh số, nối bằng mũi tên.
 */

import type { AiPipelineStep } from '@/constants/aiFeatures';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import styles from '../../AiFeatureDetailView.module.css';

export function PipelineSteps({ title, steps }: { title: string; steps: AiPipelineStep[] }) {
  return (
    <section className={styles.card} aria-labelledby="ai-pipeline-title">
      <h2 id="ai-pipeline-title" className="admin-card-title">
        {title}
      </h2>
      <ol className={styles.pipeline}>
        {steps.map((step, index) => (
          <Fragment key={step.title}>
            {index > 0 && (
              <li className={styles.pipelineArrow} aria-hidden="true">
                <ChevronRight />
              </li>
            )}
            <li className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <strong>
                <span className="sr-only">Bước {index + 1}: </span>
                {step.title}
              </strong>
              <p>{step.description}</p>
              {(step.model || step.cost) && (
                <div className={styles.stepChips}>
                  {step.model && <span className={styles.modelChip}>{step.model}</span>}
                  {step.cost && <span className={styles.costChip}>{step.cost}</span>}
                </div>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </section>
  );
}
