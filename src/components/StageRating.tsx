"use client";

import { useEffect, useRef, useState } from "react";
import VoteButtons from "@/components/VoteButtons";

export type RatingAct = {
  captionId: string;
  imageUrl: string;
  caption: string;
  score: number;
  myVote: number;
  imageNumber: number;
  captionNumber: number;
  createdAt: string;
  displayDate: string;
};

type StageRatingProps = {
  acts: RatingAct[];
  loggedIn: boolean;
};

type ExitDirection = "left" | "right" | null;

export default function StageRating({ acts, loggedIn }: StageRatingProps) {
  const [currentActs, setCurrentActs] = useState(acts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<ExitDirection>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const currentAct = currentActs[currentIndex];

  function moveTo(nextIndex: number, direction: Exclude<ExitDirection, null>) {
    if (exitDirection || currentActs.length < 2) {
      return;
    }

    setExitDirection(direction);
    timerRef.current = setTimeout(() => {
      setCurrentIndex(
        (nextIndex + currentActs.length) % currentActs.length
      );
      setExitDirection(null);
    }, 800);
  }

  function moveBy(offset: -1 | 1) {
    moveTo(currentIndex + offset, offset === 1 ? "right" : "left");
  }

  function handleReaction(
    reaction: 1 | -1,
    nextVote: number,
    nextScore: number
  ) {
    setCurrentActs((previousActs) =>
      previousActs.map((act) =>
        act.captionId === currentAct.captionId
          ? { ...act, myVote: nextVote, score: nextScore }
          : act
      )
    );
    moveTo(currentIndex + 1, reaction === 1 ? "right" : "left");
  }

  if (!currentAct) {
    return null;
  }

  return (
    <section className="rating-stage" aria-label="Rate AI-generated captions">
      <div className="rating-spotlight" aria-hidden="true" />
      <div className="rating-curtain rating-curtain-left" aria-hidden="true" />
      <div className="rating-curtain rating-curtain-right" aria-hidden="true" />

      <div className="rating-stage-header">
        <div>
          <p className="eyebrow">Now on stage</p>
          <p className="rating-progress">
            Image {currentAct.imageNumber} &middot; Caption{" "}
            {currentAct.captionNumber} of 5
          </p>
        </div>
        <time dateTime={currentAct.createdAt}>{currentAct.displayDate}</time>
      </div>

      <div className="rating-act-area">
        <button
          type="button"
          onClick={() => moveBy(-1)}
          disabled={Boolean(exitDirection)}
          className="stage-arrow stage-arrow-left"
          aria-label="Previous caption"
        >
          <span aria-hidden="true">&larr;</span>
        </button>

        <article
          key={currentAct.captionId}
          className={`rating-act ${
            exitDirection ? `rating-act-exit-${exitDirection}` : ""
          }`}
        >
          <figure className="rating-poster">
            <div className="rating-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentAct.imageUrl}
                alt="Community image with an AI-generated caption"
              />
            </div>
            <figcaption>{currentAct.caption}</figcaption>
          </figure>

          <div className="rating-reactions">
            <p>How did that one land?</p>
            <VoteButtons
              captionId={currentAct.captionId}
              score={currentAct.score}
              myVote={currentAct.myVote}
              loggedIn={loggedIn}
              onReaction={handleReaction}
            />
          </div>
        </article>

        <button
          type="button"
          onClick={() => moveBy(1)}
          disabled={Boolean(exitDirection)}
          className="stage-arrow stage-arrow-right"
          aria-label="Next caption"
        >
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>

      <div className="rating-stage-floor" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="rating-footer">
        <span>
          {currentIndex + 1} / {currentActs.length}
        </span>
        <div className="rating-track" aria-hidden="true">
          <span
            style={{
              width: `${((currentIndex + 1) / currentActs.length) * 100}%`,
            }}
          />
        </div>
        <small>React to advance automatically</small>
      </div>
    </section>
  );
}
