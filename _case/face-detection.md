---
layout: case
---

<div class="content" data-view="detection">
    <h1>Face Detection Training Data</h1>
    <p>The cutting-edge Panopticon Security Movement Layer monitors how people move through your buildings. To generate this tracking data, we ingest CCTV footage in real-time, detect faces in each frame, link faces of the same people across the footage, and transform the 2D image into a 3D map of your space.</p>
    <p>This training exercise focuses on the face detection phase. Our system boasts an industry-leading 0.03% false positive rate, meaning that only a very small amount of faces are mistakenly detected in images. We train our state-of-the-art computer vision systems using images from a variety of settings, so that we can achieve optimal results for your business.</p>
    <p>The following six images are annotated with green boxes around faces that our system has detected in the scene. For each box, determine whether or not it contains a human face. Label each box correctly and you will earn an access code for the Movement Layer.</p>
    {% for scene in site.data.scenes.scenes %}
    <h2>Scene {{ scene.id }}</h2>
    <p>
        <img src="../assets/img/scene_{{ scene.id }}.png" alt="{{ scene.caption }}" />
    </p>
    <p class="centered">Label the {{ scene.boxes | size }} box(es) detected in this scene.</p>
    {% for box in scene.boxes %}
    <div class="box-label">
        <div class="box-letter" data-letter="{{ box.letter }}">
            <p>Box {{ box.letter }}</p>
        </div>
        <div>
            <button class="button" data-label="is-face">Human Face</button>
            <button class="button" data-label="not-face">Not a Human Face</button>
        </div>
    </div>
    {% endfor %}
    {% endfor %}
    <h2>Access Code</h2>
    <p>The following access code was generated: <strong id="training-code">---</strong></p>
    <a href="../secure/movement" class="button"><i class="fa fa-male"></i> Open Movement Layer</a>
</div>