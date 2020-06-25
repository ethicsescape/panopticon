---
layout: case
title: Decision
---
<div class="content decision-form" data-view="decision">
    <h1 class="uppercase">Decision</h1>
    <p>When you have determined your prime suspect, submit your choice here with your rationale to inform store management.</p>
    <p>Data you enter here will be saved automatically. Feel free to reload the page or go to other tabs.</p>
    <div class="form">
        <select class="long-select">
            <option value="None" selected>No Shopper Selected</option>
            <option value="Shopper #1263">Shopper #1263</option>
            <option value="Shopper #6871">Shopper #6871</option>
            <option value="Shopper #6362">Shopper #6362</option>
            <option value="Shopper #1943">Shopper #1943</option>
            <option value="Shopper #2193">Shopper #2193</option>
        </select>
    </div>
    <div class="form">
        <textarea id="rationale" placeholder="Rationale for selected suspect."></textarea>
    </div>
    <div id="secret-form" class="hidden">
        <p>To complete your submission, please provide additional recommendations for store management about our security system.</p>
        <div class="form">
            <textarea id="recommendations" placeholder="Recommendations for store security system."></textarea>
        </div>
    </div>
    <p class="message"></p>
    <div class="form">
        <button>Submit</button>
    </div>
</div>