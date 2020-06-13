---
layout: case
---
<div class="content" data-view="movement">
    <h1 class="uppercase">Movement Layer</h1>
    <p>Select a shopper to view their movement data.</p>
    {% assign replays = site.data.replays | sort: "start" | reverse %}
    {% for replay in replays %}
        <div class="replay-toggle closed">
            <h2>
                <i class="icon-down fa fa-chevron-down"></i>
                <i class="icon-up fa fa-chevron-up"></i>
                <i class="fa fa-file-video-o"></i>
                <span>Shopper #{{ replay.id }}</span>
            </h2>
            <p>Arrival Time: {{ replay.start }}</p>
        </div>
        <div class="replay-drawer">
            <iframe class="video-player replay-player" src="https://www.youtube-nocookie.com/embed/{{ replay.video }}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
    {% endfor %}
</div>