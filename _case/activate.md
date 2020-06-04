---
layout: case
---
<div class="content" data-view="activate">
    <h1 class="uppercase">Dashboard</h1>
    <h2>Offer Activation</h2>
    <p>Enter your offer activation code here:</p>
    <div class="form">
        <input type="text" placeholder="offer code" />
        <button>Submit</button>
    </div>
    <p class="message"></p>
    <h2>Systems Status</h2>
    <p>Monitor the status of your security systems from this page.</p>
    <p id="systems-message" class="message"></p>
    <h3>Risk Tracking</h3>
    <div data-system="risk">
        <p class="message success"><strong>Status:</strong> <span class="status">ACTIVE</span></p>
        <span class="button"><i class="fa fa-shopping-cart"></i> <span class="verb">Deactivate</span> Risk Tracking</span>
    </div>
    <h3>Movement Tracking</h3>
    <div data-system="movement">
        <p class="message success"><strong>Status:</strong> <span class="status">ACTIVE</span></p>
        <span class="button"><i class="fa fa-male"></i> <span class="verb">Deactivate</span> Movement Tracking</span>
    </div>
    <h3>Attention Tracking</h3>
    <div data-system="attention">
        <p class="message success"><strong>Status:</strong> <span class="status">ACTIVE</span></p>
        <span class="button"><i class="fa fa-eye"></i> <span class="verb">Deactivate</span> Attention Tracking</span>
    </div>
</div>