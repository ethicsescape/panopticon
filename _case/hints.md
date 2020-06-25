---
layout: case
title: Hints
---
<div class="content" data-view="hints">
    <h1>Hints</h1>
    <p>Your team has <strong id="hints-remaining">3 hints</strong> remaining.</p>
    <p id="hints-message" class="message"></p>
    {% for clue in site.data.hints %}
    <div class="mission-row" data-clue="{{ clue.id }}">
        <button class="button mission-accept">View</button>
        <div class="mission-preview">
            <h3>
                <i class="fa fa-key"></i>
                <span>{{ clue.id }}</span>
                <span class="players message success"></span>
            </h3>
            <p>Unlocks {{ clue.preview }}</p>
        </div>
        <p class="hidden" data-platypus="{{ clue.id }}">{{ clue.hint }}</p>
    </div>
    {% endfor %}
</div>