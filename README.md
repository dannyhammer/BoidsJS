# BoidsJS
Author: Danny Hammer

---

## What is it?

A [Boid](https://en.wikipedia.org/wiki/Boids), or "bird-oid" is a term coined by Craig Reynolds in at 1986 paper about flocking behavior in birds.
The Boids algorithm is an excellent example of [emergent behavior](https://en.wikipedia.org/wiki/Emergence), as the complex flocking behavior of the swarm emerges from just three simple rules.

In this project, I set out to develop a visualization of the Boids algorithm in JavaScript. I've done this once before [using Rust](https://github.com/HammerAPI/boids), but the engine I used has since been updated, and I was generally dissatisfied with the project as a whole.
I am using HTML and JavaScript to render the Boids in a webpage.
This allows the code to be much more portable and quicker to make small changes.

---

## How does it work?

A Boid is governed by three simple rules:
1. **Separation** - Each Boid steers to avoid collision with other Boids.
2. **Cohesion** - Each Boid steers towards the center of mass of nearby flocks.
3. **Alignment** - Each Boid attempts to match the velocity of its flock-mates.

Combining these three rules results in flock-like behavior.
The algorithm itself is quite simple:

```
for each boid B:

    v1 = [0, 0]
    v2 = [0, 0]
    ...

    for every other boid D:

        if B != D:

            v1 = rule1(B, D)
            v2 = rule2(B, D)
            ...

    B.vel = B.vel + (v1 * RULE_WEIGHT) + (v2 * RULE_WEIGHT) + ...
    B.pos = B.pos + b1.vel
```

Where `ruleN()` can be any function that returns a velocity vector.

Since rules are easy to add, I've experimented and added two more:

4. **Focus** - Each Boid steers towards a focal point in the world.
5. **Jitter** - Each Boid occasionally changes direction a small amount.


### Complexity and Improvements

To compute values for Separation, Cohesion, and Alignment, each Boid must retrieve the position and velocity information from every other Boid in the environment.
This, of course, scales terrible at `O(n^2)` complexity.
To improve the efficiency, several improvements can be made.

#### Field Of View

Each Boid has a `fov` field that determines how far it can see.
In nature, an animal cannot see infinitely, so it makes sense to limit a Boid's line of sight.
This reduces complexity by requiring each Boid to only iterate over all of its *visible* neighbors, instead of every other Boid in the environment.

#### Clustering

Similar to a field of view, grouping Boids together in clusters can greatly improve performance.
By using a [density-based clustering algorithm](https://en.wikipedia.org/wiki/DBSCAN), each Boid can be assigned a cluster.
We chose a density-based algorithm because it chooses a number of clusters dynamically and can generate clusters of arbitrary shapes.
We can then tell a Boid to only iterate over its neighbors in the same cluster.
This further improves the efficiency, but we must be mindful of the complexity of the clustering algorithm.

#### Tiling

If we divide the environment into equally-sized tiles, we can classify a Boid based on which tile it is present in.
Thus, we can tell Boids to only consider neighbors in its own tile and adjacent tiles.
However, this improvement becomes less significant when our tiles become smaller, as adding more tiles is also `O(n^2)`.

I have not yet implemented this improvement in the code.


#### Parallelism

Once the positions of all Boids have been updated, there is no specification that requires Boids to have their velocities calculated sequentially.
Thus, parallelism can be introduced to evaluate the velocities of each Boid independently of each other.
A multi-threaded application can assign evaluate `k` boids in `p` threads and further optimize the simulation by reducing sequential computations.

I have not yet implemented this improvement in the code.

---

## How do I run it?

This is written in vanilla JS and HTML, so you can clone this repository and open up the `index.html` file in your browser of choice.

Alternatively, you can view [this webpage](https://dannyhammer.github.io/BoidsJS/) where I've hosted this repository using GitHub Pages.

---

## Future Ideas

I'd like to use this algorithm as a basis for some experiments.
You can add rules as you please, and each addition has the opportunity to drastically change the behavior.

Consider the following possible ideas:

* Adding a "predator" entity that pursues and consumes Boids.
* Limiting the size of clusters.
* Different "classes" of boids with different rule weights or attributes.
* Adding a goal (such as avoiding a predator or gathering resources) and an evolutionary component to make Boids reproduce and evolve after each iteration.

---

### Acknowledgements

* [upphiminn](https://github.com/upphiminn/jDBSCAN) - For the jDBSCAN clustering code
* [beneater](https://github.com/beneater/boids) - Example implementation
* [Boids Pseudocode](http://www.kfish.org/boids/pseudocode.html)
* [Canvas tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
