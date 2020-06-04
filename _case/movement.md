---
layout: case
---
<div class="content" data-view="movement">
    <h1 class="uppercase">Movement Layer</h1>
    <p>Select a shopper to view their movement data.</p>
    <hr>
    <ul class="nonlist">
        {% assign replays = site.replay | sort: "start" | reverse %}
        {% for replay in replays %}
        <li>
            <span>{{ replay.start }}</span>
            <a href="../replay/{{ replay.slug }}"><i class="fa fa-file-video-o"></i> Shopper #{{ replay.slug }}</a>
        </li>
        {% endfor %}
    </ul>
    <hr>
</div>
       
